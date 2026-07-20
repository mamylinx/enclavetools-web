#!/usr/bin/env python3
"""
pipeline.py — runs the full Enclavetools collection pipeline end to end:

  1. fetch_github.py     (Lane A: deterministic GitHub facts)
  2. run_extractor.py    (Lane B: Opencode-grounded extraction)
  3. merge_and_validate.py (merge, Lane A wins on overlap, schema-validate)
  4. build_dataset.py    (concatenate into dataset.json)

Each stage is a separate subprocess so a crash in one never corrupts state
shared with another, and so you can re-run any single stage independently
(e.g. `fetch_github.py --slug X` after fixing one repo, without re-running
the whole batch).

Usage:
    export GITHUB_TOKEN=ghp_xxx
    python3 scripts/pipeline.py --tools config/tools.csv
    python3 scripts/pipeline.py --tools config/tools.csv --slug anythingllm --force
"""

from __future__ import annotations

import argparse
import logging
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = REPO_ROOT / "scripts"

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)-7s %(message)s")
log = logging.getLogger("pipeline")


def run_stage(name: str, cmd: list[str]) -> bool:
    log.info("=== Stage: %s ===", name)
    log.info("$ %s", " ".join(cmd))
    proc = subprocess.run(cmd, cwd=str(REPO_ROOT))
    if proc.returncode != 0:
        log.error("Stage %s exited %d", name, proc.returncode)
        return False
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tools", type=Path, required=True)
    ap.add_argument("--raw-dir", type=Path, default=Path("raw"))
    ap.add_argument("--dataset-dir", type=Path, default=Path("dataset"))
    ap.add_argument("--out", type=Path, default=Path("dataset.json"))
    ap.add_argument("--slug", default=None)
    ap.add_argument("--force", action="store_true", help="Force Lane B re-extraction even if unchanged")
    ap.add_argument("--agent", default="extractor")
    ap.add_argument("--model", default=None)
    ap.add_argument("--skip-fetch", action="store_true", help="Skip Lane A (reuse existing raw/ data)")
    args = ap.parse_args()

    py = sys.executable

    if not args.skip_fetch:
        cmd = [py, str(SCRIPTS / "fetch_github.py"), "--tools", str(args.tools), "--out", str(args.raw_dir)]
        if args.slug:
            cmd += ["--slug", args.slug]
        if not run_stage("fetch_github", cmd):
            log.warning("Lane A had failures — check raw/_failures.jsonl. "
                        "Continuing with whatever succeeded (per-tool fault isolation).")

    cmd = [py, str(SCRIPTS / "run_extractor.py"), "--tools", str(args.tools),
           "--raw-dir", str(args.raw_dir), "--agent", args.agent]
    if args.model:
        cmd += ["--model", args.model]
    if args.slug:
        cmd += ["--slug", args.slug]
    if args.force:
        cmd += ["--force"]
    if not run_stage("run_extractor", cmd):
        log.warning("Lane B had failures — check raw/_manual_review.jsonl. Continuing.")

    cmd = [py, str(SCRIPTS / "merge_and_validate.py"), "--tools", str(args.tools),
           "--raw-dir", str(args.raw_dir), "--out-dir", str(args.dataset_dir)]
    if args.slug:
        cmd += ["--slug", args.slug]
    if not run_stage("merge_and_validate", cmd):
        log.warning("Merge had failures for some tools — they will be missing from the build. Continuing.")

    if not run_stage("build_dataset", [py, str(SCRIPTS / "build_dataset.py"),
                                        "--dataset-dir", str(args.dataset_dir), "--out", str(args.out)]):
        sys.exit(1)

    log.info("Pipeline complete. Final dataset: %s", args.out)


if __name__ == "__main__":
    main()
