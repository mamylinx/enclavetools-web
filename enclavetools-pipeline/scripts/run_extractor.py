#!/usr/bin/env python3
"""
run_extractor.py — Lane B orchestrator for the Enclavetools dataset pipeline.

Runs Codex on cached repository metadata and the README for each tool.
Validates the final JSON, retries invalid responses, and reuses cached
extractions when the README and repository description are unchanged.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import logging
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Lock
from typing import Optional

try:
    import jsonschema
except ImportError:
    sys.exit("Missing dependency: pip install jsonschema --break-system-packages")

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "schema" / "extractor_output.schema.json"
PROMPT_PATH = REPO_ROOT / "config" / "extractor_prompt.md"

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)-7s %(message)s",
)
log = logging.getLogger("run_extractor")
review_lock = Lock()


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


def run_codex(prompt: str, timeout: int, model: Optional[str]) -> tuple[subprocess.CompletedProcess, str]:
    with TemporaryDirectory(prefix="enclavetools-codex-") as work_dir:
        result_path = Path(work_dir) / "result.json"
        cmd = [
            "codex", "exec", "--sandbox", "read-only", "--skip-git-repo-check",
            "--ephemeral", "--ignore-user-config", "--disable", "shell_tool",
            "--disable", "unified_exec", "--disable", "apps",
            "-c", 'approval_policy="never"', "-c", 'web_search="disabled"',
            "--color", "never", "--output-last-message", str(result_path),
        ]
        if model:
            cmd += ["--model", model]
        try:
            proc = subprocess.run(
                [*cmd, "-"], input=prompt, cwd=work_dir, capture_output=True,
                encoding="utf-8", timeout=timeout, check=False,
            )
        except FileNotFoundError as e:
            raise ExtractionFailed("Codex CLI is missing from PATH. Install it and run codex login.") from e

        response = result_path.read_text(encoding="utf-8") if result_path.is_file() else ""
        return proc, response


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
                 instructions: str, timeout: int, max_retries: int,
                 model: Optional[str], debug_raw: bool, force: bool) -> dict:
    tool_dir = raw_dir / slug
    github_json_path = tool_dir / "github.json"
    readme_path = tool_dir / "readme.md"
    output_path = tool_dir / "extractor_output.json"

    if not github_json_path.exists():
        raise ExtractionFailed(f"{github_json_path} missing — run fetch_github.py first")

    readme_text = readme_path.read_text(encoding="utf-8") if readme_path.exists() else ""
    try:
        github_data = json.loads(github_json_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        raise ExtractionFailed(f"{github_json_path}: {e}") from e
    github_desc = github_data.get("fields", {}).get("body", "") or ""
    src_hash = content_hash(readme_text, github_desc)

    if not force and output_path.exists():
        try:
            existing = json.loads(output_path.read_text())
            if existing.get("_meta", {}).get("source_hash") == src_hash:
                log.info("[%s] source unchanged since last extraction — skipping (use --force to override)", slug)
                return existing
        except (json.JSONDecodeError, OSError):
            pass

    request = json.dumps({
        "schema": schema,
        "source_data": {"tool_name": tool_name, "github.json": github_data, "readme.md": readme_text},
    }, ensure_ascii=False)
    validator = jsonschema.Draft202012Validator(schema)
    base_prompt = f"{instructions}\n\nRequest (JSON):\n{request}"
    prompt = base_prompt
    failure = None
    response = ""
    for attempt in range(1, max_retries + 2):  # initial attempt + retries
        try:
            proc, response = run_codex(prompt, timeout, model)
        except subprocess.TimeoutExpired:
            failure = f"Codex timed out after {timeout}s"
            log.warning("[%s] attempt %d/%d: %s", slug, attempt, max_retries + 1, failure)
            continue

        if debug_raw:
            (tool_dir / "_codex_raw_stdout.txt").write_text(proc.stdout, encoding="utf-8")
            (tool_dir / "_codex_raw_stderr.txt").write_text(proc.stderr, encoding="utf-8")

        if proc.returncode != 0:
            failure = f"Codex exited {proc.returncode}: {proc.stderr.strip()[-800:]}"
            log.warning("[%s] attempt %d/%d: %s", slug, attempt, max_retries + 1, failure)
            continue

        try:
            payload = json.loads(response)
            if not isinstance(payload, dict):
                raise ValueError("Expected a JSON object.")
            payload = normalize_payload(payload, schema)
            validator.validate(payload)
        except (ValueError, jsonschema.ValidationError) as e:
            failure = e.message if isinstance(e, jsonschema.ValidationError) else str(e)
            log.warning("[%s] attempt %d/%d: %s", slug, attempt, max_retries + 1, failure)
            prompt = f"{base_prompt}\n\nThe previous answer was invalid. Correct this error: {failure}"
            continue

        record = {
            "fields": payload,
            "_meta": {
                "source_hash": src_hash,
                "extracted_at": datetime.now(timezone.utc).isoformat(),
                "agent": "codex",
                "attempts": attempt,
            },
        }
        output_path.write_text(json.dumps(record, indent=2, ensure_ascii=False))
        log.info("[%s] OK on attempt %d/%d", slug, attempt, max_retries + 1)
        return record

    # Exhausted retries — route to manual review, never ship an unvalidated guess.
    review_path = raw_dir / "_manual_review.jsonl"
    with review_lock, review_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps({
            "slug": slug, "reason": failure, "raw_stdout_tail": response[-2000:],
            "at": datetime.now(timezone.utc).isoformat(),
        }) + "\n")
    raise ExtractionFailed(f"[{slug}] exhausted {max_retries + 1} attempts: {failure}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tools", type=Path, required=True)
    ap.add_argument("--raw-dir", type=Path, default=Path("raw"))
    ap.add_argument("--model", default=None, help="Override the Codex model")
    ap.add_argument("--jobs", type=int, default=1, help="Maximum concurrent tool extractions (default: 1)")
    ap.add_argument("--timeout", type=int, default=180)
    ap.add_argument("--max-retries", type=int, default=2)
    ap.add_argument("--slug", default=None, help="Only process this one slug")
    ap.add_argument("--force", action="store_true", help="Re-extract even if source hash is unchanged")
    ap.add_argument("--debug-raw", action="store_true", help="Dump Codex stdout and stderr per tool")
    args = ap.parse_args()
    if args.jobs < 1:
        ap.error("--jobs must be at least 1")

    with args.tools.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if args.slug:
        rows = [r for r in rows if r["slug"] == args.slug]
        if not rows:
            raise SystemExit(f"No tool with slug={args.slug!r} in {args.tools}")

    schema = load_schema()
    instructions = PROMPT_PATH.read_text(encoding="utf-8")
    def process_rows(tool_rows: list[dict[str, str]]) -> int:
        succeeded = 0
        for row in tool_rows:
            try:
                extract_one(row["slug"], row["name"], args.raw_dir, schema, instructions,
                            args.timeout, args.max_retries, args.model, args.debug_raw, args.force)
                succeeded += 1
            except ExtractionFailed as e:
                log.error("%s", e)
        return succeeded

    if args.jobs == 1:
        ok = process_rows(rows)
    else:
        # Rows sharing a slug write to the same files, so process them in order.
        rows_by_slug: dict[str, list[dict[str, str]]] = {}
        for row in rows:
            rows_by_slug.setdefault(row["slug"], []).append(row)
        with ThreadPoolExecutor(max_workers=args.jobs) as executor:
            try:
                ok = sum(executor.map(process_rows, rows_by_slug.values()))
            except KeyboardInterrupt:
                executor.shutdown(wait=False, cancel_futures=True)
                raise
    failed = len(rows) - ok

    log.info("Done. %d ok, %d failed/queued-for-review.", ok, failed)
    if failed and not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
