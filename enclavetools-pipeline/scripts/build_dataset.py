#!/usr/bin/env python3
"""
build_dataset.py — concatenates dataset/<slug>.json records into the final
dataset.json array (the format shown in your example). Re-validates every
record against the schema at build time as a last-line check — a record could
in principle have been hand-edited into an invalid state between merge and
build, and this catches that before it ships.

Usage:
    python3 scripts/build_dataset.py --dataset-dir dataset/ --out dataset.json
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:
    sys.exit("Missing dependency: pip install jsonschema --break-system-packages")

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "schema" / "dataset_entry.schema.json"

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)-7s %(message)s")
log = logging.getLogger("build_dataset")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dataset-dir", type=Path, default=Path("dataset"))
    ap.add_argument("--out", type=Path, default=Path("dataset.json"))
    args = ap.parse_args()

    schema = json.loads(SCHEMA_PATH.read_text())
    validator = jsonschema.Draft202012Validator(schema)

    records = []
    bad = []
    for path in sorted(args.dataset_dir.glob("*.json")):
        if path.name.endswith(".confidence.json"):
            continue
        try:
            record = json.loads(path.read_text())
        except json.JSONDecodeError as e:
            bad.append((path.name, f"invalid JSON: {e}"))
            continue
        errors = sorted(validator.iter_errors(record), key=lambda e: list(e.path))
        if errors:
            bad.append((path.name, "; ".join(f"{list(e.path)}: {e.message}" for e in errors)))
            continue
        records.append(record)

    if bad:
        log.error("%d record(s) failed final validation and were EXCLUDED from the build:", len(bad))
        for name, msg in bad:
            log.error("  %s: %s", name, msg)

    records.sort(key=lambda r: r["slug"])
    args.out.write_text(json.dumps(records, indent=2, ensure_ascii=False))
    log.info("Wrote %d records to %s (%d excluded).", len(records), args.out, len(bad))
    if bad and not records:
        sys.exit(1)


if __name__ == "__main__":
    main()
