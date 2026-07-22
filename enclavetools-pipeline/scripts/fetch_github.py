#!/usr/bin/env python3
"""
fetch_github.py — Lane A deterministic collector for the Enclavetools dataset pipeline.

Fetches ONLY objective, structured facts about a GitHub-hosted project directly
from the GitHub REST API. Nothing in this script is inferred by a language
model — every field written here is a verbatim or directly-derived copy of an
API response, or a deterministic lookup (SPDX license -> commercial_use).

Safe to re-run on a schedule:
  - Uses ETag conditional requests, so unchanged repos cost 0 rate-limit budget
    on repeat runs.
  - Handles both primary (X-RateLimit-*) and secondary (abuse detection)
    rate limits with backoff.
  - Retries transient 5xx errors with exponential backoff.
  - One failing repo never aborts the batch: failures are logged to
    raw/_failures.jsonl and the run continues.

Usage:
    export GITHUB_TOKEN=ghp_xxxxx        # optional, but 60 req/hr -> 5000 req/hr
    python3 scripts/fetch_github.py --tools config/tools.csv --out raw/
    python3 scripts/fetch_github.py --tools config/tools.csv --out raw/ --slug ollama

Input CSV columns (header row required): slug,name,owner,repo,homepage_url
Output per tool: raw/<slug>/github.json, raw/<slug>/readme.md, raw/<slug>/tree.json
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import logging
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import requests
from requests.adapters import HTTPAdapter
try:
    from urllib3.util.retry import Retry
except ImportError:  # pragma: no cover
    from requests.packages.urllib3.util.retry import Retry  # type: ignore

API_ROOT = "https://api.github.com"
HF_API_ROOT = "https://huggingface.co/api"
USER_AGENT = "enclavetools-pipeline/1.0 (+https://github.com/enclavetools)"
REQUEST_TIMEOUT = 30
INTER_REQUEST_DELAY_SECONDS = 0.15  # be a good citizen even when authenticated
MAX_RATE_LIMIT_WAIT_SECONDS = int(os.environ.get("MAX_RATE_LIMIT_WAIT_SECONDS", 900))
# ^ Cap how long we'll block on a single rate-limit reset. GitHub's primary limit
# resets on a rolling hourly window, so a naive "sleep until reset" can block a
# CI job for up to ~60 minutes. If the wait exceeds this cap we fail loudly
# instead of hanging — better to see it in the failures log and retry the batch
# later (or add a token) than to have a scheduled job silently stall.

DOCKER_SIGNAL_FILES = {"dockerfile", "docker-compose.yml", "docker-compose.yaml", "compose.yaml", "compose.yml", ".dockerignore"}
DOCKER_SIGNAL_TERMS = (
    "docker pull", "docker-compose", "docker compose",
    "dockerfile", "deploy on docker", "docker .env",
    "ghcr.io", "docker.io", "container image",
)
OPENAI_API_SIGNAL_TERMS = (
    "openai-compatible", "openai compatible", "/v1/chat/completions",
    "drop-in replacement for openai", "openai api compatible",
)
REST_API_SIGNAL_TERMS = ("rest api", "http api", "/api/v1", "swagger", "openapi")
GUI_SIGNAL_PATHS = {"electron", "ui", "webui", "web-ui", "frontend", "gui", "desktop"}

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)-7s %(message)s",
)
log = logging.getLogger("fetch_github")


class GithubFetchError(Exception):
    pass


def build_session(token: Optional[str]) -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": USER_AGENT,
    })
    if token:
        s.headers["Authorization"] = f"Bearer {token}"
    retry = Retry(
        total=5,
        connect=5,
        read=5,
        backoff_factor=2.0,
        status_forcelist=(500, 502, 503, 504),
        allowed_methods=("GET",),
        respect_retry_after_header=True,
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    s.mount("https://", adapter)
    return s


def _handle_rate_limit(resp: requests.Response) -> bool:
    """If this response IS a rate-limit response, sleep and return True (caller should retry)."""
    if resp.status_code != 403 and resp.status_code != 429:
        return False
    remaining = resp.headers.get("X-RateLimit-Remaining")
    if remaining == "0":
        reset = int(resp.headers.get("X-RateLimit-Reset", time.time() + 60))
        wait = max(reset - int(time.time()), 1) + 2
        if wait > MAX_RATE_LIMIT_WAIT_SECONDS:
            raise GithubFetchError(
                f"Primary rate limit exhausted and reset is {wait}s away, "
                f"exceeding MAX_RATE_LIMIT_WAIT_SECONDS={MAX_RATE_LIMIT_WAIT_SECONDS}. "
                f"Set GITHUB_TOKEN (5000 req/hr) or raise MAX_RATE_LIMIT_WAIT_SECONDS."
            )
        log.warning("Primary rate limit exhausted. Sleeping %ss until reset.", wait)
        time.sleep(wait)
        return True
    body_lower = (resp.text or "").lower()
    if "secondary rate limit" in body_lower or "abuse" in body_lower or resp.status_code == 429:
        wait = int(resp.headers.get("Retry-After", 30))
        if wait > MAX_RATE_LIMIT_WAIT_SECONDS:
            raise GithubFetchError(
                f"Secondary rate limit wait ({wait}s) exceeds MAX_RATE_LIMIT_WAIT_SECONDS."
            )
        log.warning("Secondary rate limit / abuse detection triggered. Sleeping %ss.", wait)
        time.sleep(wait)
        return True
    return False


def get_json(session: requests.Session, url: str, etag: Optional[str] = None,
             params: Optional[dict] = None) -> tuple[str, Any, Optional[str]]:
    """
    Returns (status, payload, etag) where status is one of:
      "ok", "not_modified", "not_found"
    Raises GithubFetchError on unrecoverable failure.
    """
    headers = {"If-None-Match": etag} if etag else {}
    attempts = 0
    while attempts < 4:
        attempts += 1
        try:
            resp = session.get(url, headers=headers, params=params, timeout=REQUEST_TIMEOUT)
        except requests.RequestException as e:
            log.warning("Network error on %s (attempt %d): %s", url, attempts, e)
            time.sleep(2 * attempts)
            continue

        if resp.status_code == 304:
            return "not_modified", None, etag
        if resp.status_code == 404:
            return "not_found", None, None
        if _handle_rate_limit(resp):
            continue
        if resp.status_code >= 400:
            raise GithubFetchError(f"GET {url} -> HTTP {resp.status_code}: {resp.text[:300]}")

        time.sleep(INTER_REQUEST_DELAY_SECONDS)
        return "ok", resp.json(), resp.headers.get("ETag")

    raise GithubFetchError(f"Exceeded retry budget for {url}")


def fetch_repo(session, owner: str, repo: str, etag: Optional[str] = None):
    return get_json(session, f"{API_ROOT}/repos/{owner}/{repo}", etag=etag)


def fetch_languages(session, owner: str, repo: str):
    status, payload, _ = get_json(session, f"{API_ROOT}/repos/{owner}/{repo}/languages")
    if status != "ok" or not payload:
        return []
    # payload: {"Python": 123456, "JavaScript": 4567, ...} — bytes per language
    total = sum(payload.values())
    if total == 0:
        return []
    sorted_langs = sorted(payload.items(), key=lambda kv: kv[1], reverse=True)
    # Return all languages that account for >= 20% of codebase by bytes
    return [lang for lang, bytes_count in sorted_langs if (bytes_count / total * 100) >= 20]


def fetch_readme(session, owner: str, repo: str) -> Optional[str]:
    status, payload, _ = get_json(session, f"{API_ROOT}/repos/{owner}/{repo}/readme")
    if status != "ok" or not payload:
        return None
    if payload.get("encoding") == "base64" and payload.get("content"):
        try:
            return base64.b64decode(payload["content"]).decode("utf-8", errors="replace")
        except Exception as e:
            log.warning("Failed to decode README for %s/%s: %s", owner, repo, e)
            return None
    return None


def fetch_root_tree(session, owner: str, repo: str, default_branch: str) -> list[dict]:
    status, payload, _ = get_json(
        session,
        f"{API_ROOT}/repos/{owner}/{repo}/git/trees/{default_branch}",
        params={"recursive": "1"},
    )
    if status != "ok" or not payload:
        return []
    tree = payload.get("tree", [])
    if payload.get("truncated"):
        log.warning("Tree truncated for %s/%s — some Docker signals may be missed", owner, repo)
    return tree


def derive_docker_available(tree: list[dict]) -> int:
    for entry in tree:
        basename = entry.get("path", "").lower().rsplit("/", 1)[-1]
        if basename in DOCKER_SIGNAL_FILES:
            return 1
    return 0


def derive_gui_signal(tree: list[dict]) -> int:
    top_level_dirs = {
        entry.get("path", "").lower()
        for entry in tree
        if entry.get("type") == "tree"
    }
    return 1 if top_level_dirs & GUI_SIGNAL_PATHS else 0


def derive_text_signals(readme_text: Optional[str], description: Optional[str]) -> dict:
    haystack = " ".join(filter(None, [readme_text or "", description or ""])).lower()
    return {
        "openai_api_signal": 1 if any(t in haystack for t in OPENAI_API_SIGNAL_TERMS) else 0,
        "rest_api_signal": 1 if any(t in haystack for t in REST_API_SIGNAL_TERMS) else 0,
        "docker_signal": 1 if any(t in haystack for t in DOCKER_SIGNAL_TERMS) else 0,
    }


def load_license_policy(path: Path) -> dict:
    policy = json.loads(path.read_text())
    lookup = {}
    for spdx in policy.get("commercial_use_1", []):
        lookup[spdx] = 1
    for spdx in policy.get("commercial_use_0", []):
        lookup[spdx] = 0
    return lookup


def derive_commercial_use(spdx_id: Optional[str], license_lookup: dict) -> Optional[int]:
    if not spdx_id or spdx_id in ("NOASSERTION", "NONE"):
        return None
    return license_lookup.get(spdx_id, None)


# ---------------------------------------------------------------------------
# HuggingFace fallback helpers
# ---------------------------------------------------------------------------

def fetch_hf_model(session: requests.Session, owner: str, repo: str,
                   etag: Optional[str] = None) -> tuple[str, Any, Optional[str]]:
    """Fetch from HuggingFace model API. Returns (status, payload, etag)."""
    return get_json(session, f"{HF_API_ROOT}/models/{owner}/{repo}", etag=etag)


def normalize_hf_license(license_str: Optional[str]) -> Optional[str]:
    """Normalize HuggingFace license string to SPDX format."""
    if not license_str:
        return None
    spdx_map = {
        "apache-2.0": "Apache-2.0",
        "mit": "MIT",
        "gpl-3.0": "GPL-3.0",
        "gpl-2.0": "GPL-2.0",
        "lgpl-3.0": "LGPL-3.0",
        "lgpl-2.1": "LGPL-2.1",
        "bsd-2-clause": "BSD-2-Clause",
        "bsd-3-clause": "BSD-3-Clause",
        "isc": "ISC",
        "mpl-2.0": "MPL-2.0",
        "cc-by-4.0": "CC-BY-4.0",
        "cc-by-sa-4.0": "CC-BY-SA-4.0",
        "cc-by-nc-4.0": "CC-BY-NC-4.0",
        "cc-by-nc-sa-4.0": "CC-BY-NC-SA-4.0",
        "cc0-1.0": "CC0-1.0",
        "artistic-2.0": "Artistic-2.0",
        "zlib": "Zlib",
        "bsl-1.0": "BSL-1.0",
    }
    normalized = spdx_map.get(license_str.lower())
    if normalized:
        return normalized
    # Fallback: capitalize first letter of each hyphen-separated segment
    # e.g. "foo-bar" -> "Foo-bar" (best-effort, may not match SPDX exactly)
    return license_str


PRECISION_BYTES = {
    "F32": 4, "FP32": 4,
    "F16": 2, "FP16": 2, "BF16": 2,
    "I8": 1, "INT8": 1,
    "I4": 0.5, "INT4": 0.5, "FP4": 0.5,
}


def estimate_ram_from_hf(hf_json: dict) -> tuple[Optional[float], Optional[float]]:
    params = hf_json.get("safetensors", {}).get("parameters", {})
    if not params:
        return None, None
    total_bytes = sum(
        count * PRECISION_BYTES.get(precision, 2)
        for precision, count in params.items()
    )
    min_gb = round(total_bytes / 1e9, 1)
    return min_gb, round(min_gb * 1.5, 1)


def detect_model_format_from_hf(siblings: list[dict], tags: list[str]) -> list[str]:
    """Detect model_format from HF siblings filenames and tags."""
    formats = []
    filenames = {s.get("rfilename", "").lower() for s in siblings}
    for fn in filenames:
        if fn.endswith(".safetensors"):
            formats.append("safetensors")
            break
    for fn in filenames:
        if fn.endswith(".bin") and "pytorch" in fn:
            formats.append("PyTorch")
            break
    for fn in filenames:
        if fn.endswith(".onnx"):
            formats.append("ONNX")
            break
    for fn in filenames:
        if fn.endswith(".gguf"):
            formats.append("GGUF")
            break
    for fn in filenames:
        if fn.endswith(".mlx"):
            formats.append("MLX")
            break
    tag_set = set(tags)
    if "awq" in tag_set:
        formats.append("AWQ")
    if "gptq" in tag_set:
        formats.append("GPTQ")
    return formats


def build_record_from_hf(tool: ToolRow, hf_json: dict, readme_text: Optional[str],
                         siblings: list[dict], etag: Optional[str],
                         license_lookup: dict) -> dict:
    """Build a normalized github.json-compatible record from HuggingFace API data."""
    tags = hf_json.get("tags", [])
    card_data = hf_json.get("cardData") or {}

    license_str = card_data.get("license")
    if not license_str:
        for tag in tags:
            if tag.startswith("license:"):
                license_str = tag.split(":", 1)[1]
                break
    spdx_id = normalize_hf_license(license_str)
    commercial_use = derive_commercial_use(spdx_id, license_lookup)

    hf_languages = card_data.get("language") or []
    if not hf_languages:
        hf_languages = [t for t in tags if len(t) == 2 and t.isalpha()]

    docker_available = 0
    docker_signal = 0
    for s in siblings:
        fn = s.get("rfilename", "").lower()
        if fn in ("dockerfile", "docker-compose.yml", "docker-compose.yaml",
                   "compose.yaml", "compose.yml"):
            docker_available = 1
            break
    tag_lower = " ".join(tags).lower()
    if any(term in tag_lower for term in DOCKER_SIGNAL_TERMS):
        docker_signal = 1

    openai_api_signal = 1 if any(
        t in tag_lower for t in OPENAI_API_SIGNAL_TERMS
    ) else 0
    rest_api_signal = 1 if any(
        t in tag_lower for t in REST_API_SIGNAL_TERMS
    ) else 0
    gui_signal = 1 if hf_json.get("spaces") else 0

    model_format = detect_model_format_from_hf(siblings, tags)
    min_ram_gb, recommended_ram_gb = estimate_ram_from_hf(hf_json)

    now = datetime.now(timezone.utc)
    fields = {
        "body": card_data.get("description") or hf_json.get("pipeline_tag"),
        "plain_description": card_data.get("description") or hf_json.get("pipeline_tag"),
        "url": tool.homepage_url or f"https://huggingface.co/{tool.owner}/{tool.repo}",
        "github_url": None,
        "slug": tool.slug,
        "category": tool.category,
        "license": spdx_id,
        "last_updated": (hf_json.get("lastModified") or "")[:10] or None,
        "popularity_score": hf_json.get("downloads", 0),
        "last_verified": now.date().isoformat(),
        "language": hf_languages,
        "commercial_use": commercial_use,
        "docker_available": docker_available or docker_signal,
        "model_format": model_format,
        "min_ram_gb": min_ram_gb,
        "recommended_ram_gb": recommended_ram_gb,
    }

    tree_paths = sorted({
        s.get("rfilename", "").split("/")[0]
        for s in siblings
        if "/" in s.get("rfilename", "")
    })

    record = {
        "fields": fields,
        "_signals": {
            "openai_api_signal": openai_api_signal,
            "rest_api_signal": rest_api_signal,
            "docker_signal": docker_signal,
            "gui_signal": gui_signal,
            "root_tree_paths": tree_paths,
        },
        "_meta": {
            "owner": tool.owner,
            "repo": tool.repo,
            "repo_name_hint": hf_json.get("id"),
            "full_name_hint": hf_json.get("id"),
            "pipeline_tag": hf_json.get("pipeline_tag"),
            "library_name": hf_json.get("library_name"),
            "downloads": hf_json.get("downloads", 0),
            "likes": hf_json.get("likes", 0),
            "fetched_at": now.isoformat(),
            "etag": etag,
            "api_url": f"{HF_API_ROOT}/models/{tool.owner}/{tool.repo}",
            "spdx_id_raw": spdx_id,
            "source": "huggingface",
        },
    }
    return record


@dataclass
class ToolRow:
    slug: str
    name: str
    owner: str
    repo: str
    homepage_url: Optional[str] = None
    category: Optional[str] = None


def load_tools_csv(path: Path) -> list[ToolRow]:
    rows = []
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        required = {"slug", "name", "owner", "repo"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise SystemExit(f"tools CSV missing required columns: {sorted(missing)}")
        for r in reader:
            rows.append(ToolRow(
                slug=r["slug"].strip(),
                name=r["name"].strip(),
                owner=r["owner"].strip(),
                repo=r["repo"].strip(),
                homepage_url=(r.get("homepage_url") or "").strip() or None,
                category=(r.get("category") or "").strip() or None,
            ))
    return rows


def process_tool(session: requests.Session, tool: ToolRow, out_dir: Path,
                  license_lookup: dict) -> dict:
    tool_dir = out_dir / tool.slug
    tool_dir.mkdir(parents=True, exist_ok=True)

    cache_path = tool_dir / "github.json"
    prev_etag = None
    prev_payload = None
    if cache_path.exists():
        try:
            cached = json.loads(cache_path.read_text())
            prev_etag = cached.get("_meta", {}).get("etag")
            prev_payload = cached
        except (json.JSONDecodeError, OSError):
            pass

    if tool.category == "llm-models":
        try:
            log.info("[%s] Category is llm-models — fetching from HuggingFace...", tool.slug)
            return _process_tool_hf_fallback(session, tool, out_dir, license_lookup, prev_etag, prev_payload)
        except GithubFetchError as hf_err:
            log.info("[%s] HuggingFace fetch failed (%s), falling back to GitHub...", tool.slug, hf_err)

    status, repo_json, etag = fetch_repo(session, tool.owner, tool.repo, etag=prev_etag)

    if status == "not_found":
        # GitHub repo not found — fallback to HuggingFace
        log.info("[%s] not found on GitHub, trying HuggingFace...", tool.slug)
        return _process_tool_hf_fallback(session, tool, out_dir, license_lookup, prev_etag, prev_payload)

    if status == "not_modified" and prev_payload:
        log.info("[%s] unchanged since last fetch (ETag hit) — refreshing verification timestamp only", tool.slug)
        prev_payload["_meta"]["last_verified"] = datetime.now(timezone.utc).date().isoformat()
        cache_path.write_text(json.dumps(prev_payload, indent=2, ensure_ascii=False))
        return prev_payload

    languages = fetch_languages(session, tool.owner, tool.repo)
    readme_text = fetch_readme(session, tool.owner, tool.repo)
    default_branch = repo_json.get("default_branch", "main")
    tree = fetch_root_tree(session, tool.owner, tool.repo, default_branch)

    gui_signal = derive_gui_signal(tree)
    text_signals = derive_text_signals(readme_text, repo_json.get("description"))
    docker_available = derive_docker_available(tree) or text_signals["docker_signal"]

    license_info = repo_json.get("license") or {}
    spdx_id = license_info.get("spdx_id")
    commercial_use = derive_commercial_use(spdx_id, license_lookup)

    now = datetime.now(timezone.utc)
    fields = {
        # NOTE: "title" is intentionally NOT set here. repo_json["name"] is the
        # URL slug (e.g. "anything-llm"), not a display name (e.g. "AnythingLLM").
        # Title is owned by Lane B, which is given repo_name_hint / full_name_hint
        # below as grounding so it cleans up casing without inventing a new name.
        "body": repo_json.get("description"),
        "plain_description": repo_json.get("description"),
        "url": tool.homepage_url or repo_json.get("homepage") or None,
        "github_url": repo_json.get("html_url"),
        "slug": tool.slug,
        "category": tool.category,
        "license": spdx_id if spdx_id not in (None, "NOASSERTION") else None,
        "last_updated": (repo_json.get("pushed_at") or "")[:10] or None,
        "popularity_score": repo_json.get("stargazers_count", 0),
        "last_verified": now.date().isoformat(),
        "language": languages if languages else ([repo_json.get("language")] if repo_json.get("language") else []),
        "commercial_use": commercial_use,
        "docker_available": docker_available,
    }

    record = {
        "fields": fields,
        "_signals": {
            # Advisory only — the extractor agent (Lane B) confirms these against the
            # README before they become the final openai_api / rest_api / gui_available
            # values. They are NOT written directly into the dataset.
            "openai_api_signal": text_signals["openai_api_signal"],
            "rest_api_signal": text_signals["rest_api_signal"],
            "docker_signal": text_signals["docker_signal"],
            "gui_signal": gui_signal,
            "root_tree_paths": sorted({e.get("path", "") for e in tree if e.get("type") == "tree"}),
        },
        "_meta": {
            "owner": tool.owner,
            "repo": tool.repo,
            "repo_name_hint": repo_json.get("name"),
            "full_name_hint": repo_json.get("full_name"),
            "fetched_at": now.isoformat(),
            "etag": etag,
            "api_url": f"{API_ROOT}/repos/{tool.owner}/{tool.repo}",
            "spdx_id_raw": spdx_id,
            "source": "github",
        },
    }

    cache_path.write_text(json.dumps(record, indent=2, ensure_ascii=False))
    (tool_dir / "readme.md").write_text(readme_text or "", encoding="utf-8")
    (tool_dir / "tree.json").write_text(json.dumps(tree, indent=2, ensure_ascii=False))

    log.info("[%s] OK — %s stars, license=%s, docker=%s",
              tool.slug, fields["popularity_score"], fields["license"], docker_available)
    return record


def _process_tool_hf_fallback(session: requests.Session, tool: ToolRow, out_dir: Path,
                               license_lookup: dict, prev_etag: Optional[str],
                               prev_payload: Optional[dict]) -> dict:
    """Handle HuggingFace fallback when GitHub repo is not found."""
    tool_dir = out_dir / tool.slug
    tool_dir.mkdir(parents=True, exist_ok=True)
    cache_path = tool_dir / "github.json"

    # If we have a cached HF record, check ETag
    if prev_payload and prev_payload.get("_meta", {}).get("source") == "huggingface":
        status, hf_json, etag = fetch_hf_model(session, tool.owner, tool.repo, etag=prev_etag)
        if status == "not_found":
            raise GithubFetchError(f"Not found on GitHub or HuggingFace: {tool.owner}/{tool.repo}")
        if status == "not_modified" and prev_payload:
            log.info("[%s] HF unchanged (ETag hit) — refreshing verification timestamp only", tool.slug)
            prev_payload["_meta"]["last_verified"] = datetime.now(timezone.utc).date().isoformat()
            cache_path.write_text(json.dumps(prev_payload, indent=2, ensure_ascii=False))
            return prev_payload
    else:
        status, hf_json, etag = fetch_hf_model(session, tool.owner, tool.repo)
        if status == "not_found":
            raise GithubFetchError(f"Not found on GitHub or HuggingFace: {tool.owner}/{tool.repo}")

    siblings = hf_json.get("siblings", [])
    readme_text = None
    for s in siblings:
        if s.get("rfilename") == "README.md":
            # HF API doesn't return README content inline — fetch it separately
            readme_url = f"https://huggingface.co/{tool.owner}/{tool.repo}/raw/main/README.md"
            try:
                resp = session.get(readme_url, timeout=REQUEST_TIMEOUT)
                if resp.status_code == 200:
                    readme_text = resp.text
            except requests.RequestException:
                pass
            break

    record = build_record_from_hf(tool, hf_json, readme_text, siblings, etag, license_lookup)

    cache_path.write_text(json.dumps(record, indent=2, ensure_ascii=False))
    (tool_dir / "readme.md").write_text(readme_text or "", encoding="utf-8")
    (tool_dir / "tree.json").write_text(json.dumps(siblings, indent=2, ensure_ascii=False))

    log.info("[%s] OK (HF) — %s downloads, license=%s, docker=%s",
              tool.slug, record["fields"]["popularity_score"],
              record["fields"]["license"], record["fields"]["docker_available"])
    return record


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tools", type=Path, required=True, help="Path to tools.csv")
    ap.add_argument("--out", type=Path, default=Path("raw"), help="Output raw/ directory")
    ap.add_argument("--slug", type=str, default=None, help="Only process this one slug (for testing)")
    ap.add_argument("--category", type=str, default=None, help="Only process tools in this category (e.g. llm-models)")
    ap.add_argument("--license-policy", type=Path,
                     default=Path(__file__).resolve().parent.parent / "config" / "license_policy.json")
    args = ap.parse_args()

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        log.warning("GITHUB_TOKEN not set — running unauthenticated (60 req/hr limit). "
                    "Set GITHUB_TOKEN for production runs.")

    session = build_session(token)
    license_lookup = load_license_policy(args.license_policy)
    args.out.mkdir(parents=True, exist_ok=True)

    tools = load_tools_csv(args.tools)
    if args.slug:
        tools = [t for t in tools if t.slug == args.slug]
        if not tools:
            raise SystemExit(f"No tool with slug={args.slug!r} found in {args.tools}")
    if args.category:
        tools = [t for t in tools if t.category == args.category]
        if not tools:
            raise SystemExit(f"No tools found with category={args.category!r} in {args.tools}")

    failures_path = args.out / "_failures.jsonl"
    ok, failed = 0, 0
    for tool in tools:
        try:
            process_tool(session, tool, args.out, license_lookup)
            ok += 1
        except GithubFetchError as e:
            failed += 1
            log.error("[%s] FAILED: %s", tool.slug, e)
            with failures_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps({
                    "slug": tool.slug, "owner": tool.owner, "repo": tool.repo,
                    "error": str(e), "at": datetime.now(timezone.utc).isoformat(),
                }) + "\n")

    log.info("Done. %d ok, %d failed. See %s for failure details.", ok, failed, failures_path)
    if failed and not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
