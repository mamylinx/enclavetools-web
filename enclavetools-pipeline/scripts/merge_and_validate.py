#!/usr/bin/env python3
"""
merge_and_validate.py — merges Lane A (raw/<slug>/github.json) and Lane B
(raw/<slug>/extractor_output.json) into a final dataset record, validates it
against schema/dataset_entry.schema.json, and writes dataset/<slug>.json.

Merge rule: Lane A ALWAYS wins on any field it owns, even if Lane B somehow
produced a value for it (it shouldn't, per extractor_output.schema.json's
additionalProperties: false, but this is a second, independent guard rather
than trusting that one schema alone).

Fields owned by neither lane (curation-only: `featured`, `community_notes`,
`community_guides`, their `_count`s) get safe defaults on first insert and are
PRESERVED unchanged on every subsequent run — this script reads any existing
dataset/<slug>.json first and carries these fields forward rather than
resetting them, so manual curation work is never clobbered by a re-run.

`date-added` is set once (on first insert) and never overwritten.
`slug` and `last_verified` come from Lane A on every run.

Usage:
    python3 scripts/merge_and_validate.py --raw-dir raw/ --out-dir dataset/ --tools config/tools.csv
    python3 scripts/merge_and_validate.py --raw-dir raw/ --out-dir dataset/ --slug anythingllm
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import jsonschema
except ImportError:
    sys.exit("Missing dependency: pip install jsonschema --break-system-packages")

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "schema" / "dataset_entry.schema.json"

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)-7s %(message)s")
log = logging.getLogger("merge_and_validate")

# Fields Lane A owns outright. If present in Lane B's output for any reason,
# Lane A's value overwrites it unconditionally.
LANE_A_FIELDS = {
    "body", "plain_description", "url", "github_url", "slug", "license",
    "last_updated", "popularity_score", "last_verified", "language",
    "commercial_use", "docker_available",
}

# Fields that are curation-only: never produced by either lane, only ever
# set/edited by a human (or a separate community-content ingestion job).
# Preserved from the existing dataset record across runs; defaulted on first
# insert only.
CURATION_FIELDS_DEFAULTS = {
    "featured": False,
    "community_notes": [],
    "community_guides": [],
}


class MergeError(Exception):
    pass


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text())


def merge_one(slug: str, raw_dir: Path, out_dir: Path, schema: dict) -> dict:
    github_path = raw_dir / slug / "github.json"
    extractor_path = raw_dir / slug / "extractor_output.json"
    existing_path = out_dir / f"{slug}.json"

    if not github_path.exists():
        raise MergeError(f"{github_path} missing — run fetch_github.py first")
    if not extractor_path.exists():
        raise MergeError(f"{extractor_path} missing — run run_extractor.py first")

    lane_a = json.loads(github_path.read_text())["fields"]
    lane_b = json.loads(extractor_path.read_text())["fields"]
    # field_confidence is metadata about the extraction, not a dataset field —
    # keep it out of the merged record but don't lose it; stash alongside.
    field_confidence = lane_b.pop("field_confidence", {})

    existing = {}
    if existing_path.exists():
        try:
            existing = json.loads(existing_path.read_text())
        except json.JSONDecodeError:
            log.warning("[%s] existing dataset record is corrupt JSON — ignoring it for curation-field carryover", slug)

    merged = dict(lane_b)  # start from Lane B (the larger field set)
    for key in LANE_A_FIELDS:
        if key in lane_a:
            merged[key] = lane_a[key]

    # Curation-only fields: carry forward existing values, else default.
    for key, default in CURATION_FIELDS_DEFAULTS.items():
        merged[key] = existing.get(key, default)
    merged["community_notes_count"] = len(merged["community_notes"])
    merged["community_guides_count"] = len(merged["community_guides"])

    # date-added: set once, never overwritten.
    merged["date-added"] = existing.get("date-added") or datetime.now(timezone.utc).date().isoformat()

    try:
        jsonschema.Draft202012Validator(schema).validate(merged)
    except jsonschema.ValidationError as e:
        raise MergeError(f"[{slug}] merged record failed schema validation: {e.message} (path: {list(e.path)})")

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slug}.json"
    out_path.write_text(json.dumps(merged, indent=2, ensure_ascii=False, sort_keys=True))

    # Confidence report kept separately so low-confidence fields are easy to
    # find for manual review without polluting the shipped dataset record.
    if field_confidence:
        low_conf = {k: v for k, v in field_confidence.items() if v == "low"}
        if low_conf:
            log.warning("[%s] low-confidence fields: %s", slug, sorted(low_conf.keys()))
        (out_dir / f"{slug}.confidence.json").write_text(
            json.dumps(field_confidence, indent=2, sort_keys=True)
        )

    log.info("[%s] merged and validated OK -> %s", slug, out_path)
    return merged


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--raw-dir", type=Path, default=Path("raw"))
    ap.add_argument("--out-dir", type=Path, default=Path("dataset"))
    ap.add_argument("--tools", type=Path, required=True)
    ap.add_argument("--slug", default=None)
    args = ap.parse_args()

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
            merge_one(row["slug"], args.raw_dir, args.out_dir, schema)
            ok += 1
        except MergeError as e:
            failed += 1
            log.error(str(e))

    log.info("Done. %d ok, %d failed.", ok, failed)
    if failed and not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
