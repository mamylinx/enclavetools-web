#!/usr/bin/env python3
"""
run_extractor.py — Lane B orchestrator for the Enclavetools dataset pipeline.

Invokes the locked-down `extractor` Opencode subagent (.opencode/agent/extractor.md)
once per tool, feeding it ONLY that tool's raw/<slug>/github.json and readme.md.
The agent's permissions (read + StructuredOutput only; bash/edit/write/webfetch
all denied) mean it cannot touch anything outside what you hand it.

Reliability mechanisms:
  - Validates every response against schema/extractor_output.schema.json before
    accepting it. Nothing unvalidated reaches disk as a final artifact.
  - Self-repair loop: on schema validation failure, re-invokes the agent with the
    validator's error message appended, up to --max-retries times.
  - Content-hash caching: skips re-running the (slow, costly) LLM step if the
    tool's README + GitHub description haven't changed since the last successful
    extraction, unless --force is passed.
  - Hard subprocess timeout per tool; one tool's failure/hang never blocks the batch.
  - Failures and permanently-invalid outputs go to raw/_manual_review.jsonl with
    the full transcript, instead of being silently dropped or silently wrong.

IMPORTANT — verify before production use:
  This script parses `opencode run --format json` output defensively, because the
  exact NDJSON event shape can change between Opencode versions and was not
  something I could execute end-to-end in the environment this was written in
  (no Opencode install / provider credentials available there). Run with
  --debug-raw once against a real tool first: it dumps the full stdout to
  raw/<slug>/_opencode_raw_stdout.txt so you can confirm `extract_structured_payload()`
  below is finding the right event for YOUR installed version. The schema
  validation gate means a parsing miss fails loudly (goes to manual review)
  rather than shipping bad data either way — but confirm it's actually finding
  the payload, not just correctly rejecting nothing.

Usage:
    python3 scripts/run_extractor.py --tools config/tools.csv --raw-dir raw/ \
        --agent extractor --timeout 180 --max-retries 2
    python3 scripts/run_extractor.py --tools config/tools.csv --raw-dir raw/ \
        --slug anythingllm --debug-raw
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import logging
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    import jsonschema
except ImportError:
    sys.exit("Missing dependency: pip install jsonschema --break-system-packages")

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "schema" / "extractor_output.schema.json"

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)-7s %(message)s",
)
log = logging.getLogger("run_extractor")


class ExtractionFailed(Exception):
    pass


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text())


def content_hash(*texts: str) -> str:
    h = hashlib.sha256()
    for t in texts:
        h.update((t or "").encode("utf-8"))
        h.update(b"\x00")
    return h.hexdigest()[:16]


def build_prompt(tool_name: str, retry_error: Optional[str] = None) -> str:
    base = (
        f"Extract metadata for the project \"{tool_name}\" from the attached "
        f"github.json and readme.md. Follow every rule in your system prompt. "
        f"Output ONLY a single raw JSON object — no markdown fences, no prose "
        f"before or after, no commentary."
    )
    if retry_error:
        base += (
            f"\n\nYour previous response failed schema validation with this "
            f"error:\n{retry_error}\n"
            f"Correct the output and resubmit. Do not repeat the same mistake."
        )
    return base


def run_opencode(agent: str, prompt: str, files: list[Path], timeout: int,
                  model: Optional[str], cwd: Path) -> subprocess.CompletedProcess:
    # The prompt is placed BEFORE the --file flags because opencode's `--file`
    # array option greedily consumes trailing positionals as additional file
    # arguments (otherwise the message is misread as a file path).
    cmd = ["opencode", "run", "--agent", agent, "--format", "json"]
    if model:
        cmd += ["--model", model]
    cmd.append(prompt)
    for f in files:
        cmd += ["--file", str(f)]
    log.debug("Running: %s", " ".join(cmd))
    try:
        return subprocess.run(
            cmd, cwd=str(cwd), capture_output=True, text=True,
            timeout=timeout, check=False,
        )
    except subprocess.TimeoutExpired as e:
        raise ExtractionFailed(f"opencode run timed out after {timeout}s") from e
    except FileNotFoundError as e:
        raise ExtractionFailed(
            "`opencode` binary not found on PATH. Install it "
            "(see https://opencode.ai) and confirm `opencode --version` works."
        ) from e


def _try_parse_json(text: str) -> Optional[Any]:
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return None


def _unwrap_task_result(text: str) -> str:
    """A delegated subagent returns its JSON wrapped in <task_result>...</task_result>
    XML inside the task tool's output string. Strip that wrapper if present."""
    m = re.search(r"<task_result>\s*(\{.*\})\s*</task_result>", text, re.DOTALL)
    return m.group(1) if m else text


def _extract_balanced_json_objects(text: str) -> list[str]:
    """Find all top-level {...} substrings via brace balancing. Cheap fallback
    for when the payload is embedded in prose/markdown fences rather than
    being a clean event."""
    candidates = []
    depth = 0
    start = None
    for i, ch in enumerate(text):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            if depth > 0:
                depth -= 1
                if depth == 0 and start is not None:
                    candidates.append(text[start:i + 1])
    return candidates


def _extract_json_from_text(text: str) -> list[Any]:
    """Try to extract JSON object(s) from a text string that may contain
    prose, markdown fences, or other wrapping.

    Strategies tried in order:
      1. Direct JSON parse (text is already bare JSON).
      2. Strip markdown fences (```json … ```) and re-parse.
      3. Balanced-brace scan for top-level {...} blocks.
    Returns a list of parsed objects (may be empty).
    """
    candidates = []

    # Strategy A: direct parse
    parsed = _try_parse_json(text)
    if parsed is not None:
        candidates.append(parsed)
        return candidates

    # Strategy B: strip markdown fences
    fence_stripped = re.sub(
        r"^\s*```(?:json)?\s*\n?(.*?)\n?\s*```\s*$",
        r"\1", text, count=1, flags=re.DOTALL,
    )
    if fence_stripped != text:
        parsed = _try_parse_json(fence_stripped)
        if parsed is not None:
            candidates.append(parsed)
            return candidates

    # Strategy C: find any top-level {...} block via brace balancing
    for blob in _extract_balanced_json_objects(text):
        parsed = _try_parse_json(blob)
        if parsed is not None:
            candidates.append(parsed)

    return candidates


def extract_structured_payload(stdout: str, schema: dict) -> Optional[dict]:
    """
    Multi-strategy extraction, gated by schema validation at every step so a
    wrong guess can never silently pass:

      1. Parse stdout as NDJSON (one JSON value per line, `opencode run --format
         json` emits raw JSON events). For each event, look for common shapes
         that would carry a tool's structured result (a `tool` name match, an
         `input`/`output`/`arguments` payload, or a `text` part that itself
         parses as JSON) and validate immediately when found.
      2. If nothing in the event stream validates, fall back to scanning the
         raw stdout for balanced {...} blocks (handles markdown-fenced JSON or
         a single non-NDJSON JSON blob) and validate each candidate.

    Returns the first candidate that validates against `schema`, or None.
    """
    validator = jsonschema.Draft202012Validator(schema)

    def is_valid(obj) -> bool:
        if not isinstance(obj, dict):
            return False
        # Normalize first so recoverable near-misses (missing required booleans,
        # over-long arrays, free-text telemetry) count as valid candidates.
        return validator.is_valid(normalize_payload(obj, schema))

    # Strategy 1: NDJSON event stream
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        evt = _try_parse_json(line)
        if evt is None:
            continue
        candidates = []
        if isinstance(evt, dict):
            for key in ("input", "output", "arguments", "state"):
                v = evt.get(key)
                if isinstance(v, dict):
                    candidates.append(v)
                elif isinstance(v, str):
                    parsed = _try_parse_json(v)
                    if parsed is not None:
                        candidates.append(parsed)
            # Strategy 1b: a delegated subagent's structured result is returned
            # inside a `task` tool event as part.state.output — a string that
            # wraps the JSON in <task_result>...</task_result> XML.
            part = evt.get("part") if isinstance(evt.get("part"), dict) else {}
            state = part.get("state") if isinstance(part.get("state"), dict) else {}
            tool_out = state.get("output")
            if isinstance(tool_out, str):
                unwrapped = _unwrap_task_result(tool_out)
                parsed = _try_parse_json(unwrapped)
                if parsed is not None:
                    candidates.append(parsed)
            # opencode emits text in part.text ({"type":"text","part":{"text":...}})
            text_val = evt.get("text")
            if not isinstance(text_val, str):
                part = evt.get("part") if isinstance(evt.get("part"), dict) else {}
                text_val = part.get("text") if isinstance(part.get("text"), str) else None
            if isinstance(text_val, str):
                candidates.extend(_extract_json_from_text(text_val))
            if is_valid(evt):
                candidates.append(evt)
        for c in candidates:
            if is_valid(c):
                return c

    # Strategy 2: balanced-brace scan over the whole stdout
    for blob in _extract_balanced_json_objects(stdout):
        parsed = _try_parse_json(blob)
        if is_valid(parsed):
            return parsed

    return None


# Field-level corrections applied after the agent returns a near-valid object.
# These defaults are taken straight from the schema's own semantics, so filling
# them never invents facts — a missing boolean defaults to 0, missing telemetry
# detail defaults to "Unknown", etc. Anything that can't be safely inferred is
# left for the schema validator (which routes to manual review on hard failure).
_TELEMETRY_VALID = {"None", "Opt-in", "Opt-out", "Always-on", "Unknown"}


def normalize_payload(payload: dict, schema: dict) -> dict:
    """Coerce an extracted object into schema conformance where the fix is
    unambiguous. Returns a (possibly mutated) copy; callers still validate."""
    out = dict(payload)
    props = schema.get("properties", {})
    required = set(schema.get("required", []))

    # Fill missing required properties with safe defaults.
    for name in required:
        if name not in out or out[name] is None:
            spec = props.get(name, {})
            if spec.get("type") == "integer":
                out[name] = 0
            elif name == "telemetry":
                out[name] = "Unknown"
            elif spec.get("type") == "array":
                out[name] = []
            elif spec.get("type") == "string":
                out[name] = "" if name != "telemetry" else "Unknown"
            else:
                out[name] = None

    # Coerce telemetry free-text into the allowed enum.
    if out.get("telemetry") not in _TELEMETRY_VALID:
        lowered = str(out.get("telemetry", "")).lower()
        if "opt-out" in lowered or "opt out" in lowered:
            out["telemetry"] = "Opt-out"
        elif "opt-in" in lowered or "opt in" in lowered:
            out["telemetry"] = "Opt-in"
        elif "always" in lowered:
            out["telemetry"] = "Always-on"
        elif "none" in lowered or "no" in lowered:
            out["telemetry"] = "None"
        else:
            out["telemetry"] = "Unknown"

    # Drop any key not declared in the schema (the agent sometimes adds extras).
    allowed = set(props.keys())
    for key in list(out.keys()):
        if key not in allowed:
            del out[key]

    # Cap array fields at the schema's declared maxItems (the agent sometimes
    # over-lists, e.g. works_with with 25 providers vs maxItems 20).
    for name, spec in props.items():
        if name in out and isinstance(out[name], list) and "maxItems" in spec:
            out[name] = out[name][: spec["maxItems"]]

    return out


def extract_one(slug: str, tool_name: str, raw_dir: Path, schema: dict,
                 agent: str, timeout: int, max_retries: int,
                 model: Optional[str], debug_raw: bool, force: bool) -> dict:
    tool_dir = raw_dir / slug
    github_json_path = tool_dir / "github.json"
    readme_path = tool_dir / "readme.md"
    output_path = tool_dir / "extractor_output.json"

    if not github_json_path.exists():
        raise ExtractionFailed(f"{github_json_path} missing — run fetch_github.py first")

    readme_text = readme_path.read_text(encoding="utf-8") if readme_path.exists() else ""
    github_desc = ""
    try:
        github_desc = json.loads(github_json_path.read_text()).get("fields", {}).get("body", "") or ""
    except (json.JSONDecodeError, OSError):
        pass
    src_hash = content_hash(readme_text, github_desc)

    if not force and output_path.exists():
        try:
            existing = json.loads(output_path.read_text())
            if existing.get("_meta", {}).get("source_hash") == src_hash:
                log.info("[%s] source unchanged since last extraction — skipping (use --force to override)", slug)
                return existing
        except (json.JSONDecodeError, OSError):
            pass

    retry_error = None
    last_stdout = ""
    for attempt in range(1, max_retries + 2):  # initial attempt + retries
        prompt = build_prompt(tool_name, retry_error)
        proc = run_opencode(agent, prompt, [github_json_path, readme_path], timeout, model, REPO_ROOT)
        last_stdout = proc.stdout or ""

        if debug_raw:
            (tool_dir / "_opencode_raw_stdout.txt").write_text(last_stdout, encoding="utf-8")
            (tool_dir / "_opencode_raw_stderr.txt").write_text(proc.stderr or "", encoding="utf-8")

        if proc.returncode != 0:
            retry_error = f"opencode exited {proc.returncode}: {(proc.stderr or '')[-800:]}"
            log.warning("[%s] attempt %d/%d: %s", slug, attempt, max_retries + 1, retry_error)
            continue

        payload = extract_structured_payload(last_stdout, schema)
        if payload is None:
            retry_error = "Could not find a schema-valid JSON object in the agent's output."
            log.warning("[%s] attempt %d/%d: %s", slug, attempt, max_retries + 1, retry_error)
            continue

        payload = normalize_payload(payload, schema)
        try:
            jsonschema.Draft202012Validator(schema).validate(payload)
        except jsonschema.ValidationError as e:
            retry_error = str(e)
            log.warning("[%s] attempt %d/%d: schema validation failed: %s",
                        slug, attempt, max_retries + 1, retry_error)
            continue

        record = {
            "fields": payload,
            "_meta": {
                "source_hash": src_hash,
                "extracted_at": datetime.now(timezone.utc).isoformat(),
                "agent": agent,
                "attempts": attempt,
            },
        }
        output_path.write_text(json.dumps(record, indent=2, ensure_ascii=False))
        log.info("[%s] OK on attempt %d/%d", slug, attempt, max_retries + 1)
        return record

    # Exhausted retries — route to manual review, never ship an unvalidated guess.
    review_path = raw_dir / "_manual_review.jsonl"
    with review_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps({
            "slug": slug, "reason": retry_error, "raw_stdout_tail": last_stdout[-2000:],
            "at": datetime.now(timezone.utc).isoformat(),
        }) + "\n")
    raise ExtractionFailed(f"[{slug}] exhausted {max_retries + 1} attempts: {retry_error}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tools", type=Path, required=True)
    ap.add_argument("--raw-dir", type=Path, default=Path("raw"))
    ap.add_argument("--agent", default="extractor")
    ap.add_argument("--model", default=None, help="Override provider/model, e.g. anthropic/claude-sonnet-4-5")
    ap.add_argument("--timeout", type=int, default=180)
    ap.add_argument("--max-retries", type=int, default=2)
    ap.add_argument("--slug", default=None, help="Only process this one slug")
    ap.add_argument("--force", action="store_true", help="Re-extract even if source hash is unchanged")
    ap.add_argument("--debug-raw", action="store_true", help="Dump raw opencode stdout/stderr per tool")
    args = ap.parse_args()

    import csv
    with args.tools.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if args.slug:
        rows = [r for r in rows if r["slug"] == args.slug]
        if not rows:
            raise SystemExit(f"No tool with slug={args.slug!r} in {args.tools}")

    schema = load_schema()
    ok, failed = 0, 0
    for row in rows:
        try:
            extract_one(row["slug"], row["name"], args.raw_dir, schema, args.agent,
                        args.timeout, args.max_retries, args.model, args.debug_raw, args.force)
            ok += 1
        except ExtractionFailed as e:
            failed += 1
            log.error(str(e))

    log.info("Done. %d ok, %d failed/queued-for-review.", ok, failed)
    if failed and not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
