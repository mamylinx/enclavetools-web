# Enclavetools dataset pipeline

Two-lane collection pipeline for the Enclavetools dataset. Lane A is a
deterministic GitHub API fetcher (no LLM involved). Lane B is a locked-down
Opencode subagent that only paraphrases/classifies from files it's handed —
it can't run commands, edit files, or fetch anything on its own.

## Setup

```bash
pip install -r requirements.txt --break-system-packages
export GITHUB_TOKEN=ghp_xxxxxxxx        # required for real batches (5000 req/hr vs 60)
opencode auth login                     # configure your model provider once
```

Verify Opencode sees the extractor agent:

```bash
opencode agent list
```

If it's not listed, confirm `.opencode/agent/extractor.md` is in the directory
you run these scripts from (Opencode loads project-level agents relative to
cwd — see `opencode.ai/docs/agents`).

## First run — do this before scaling up

```bash
python3 scripts/pipeline.py --tools config/tools.example.csv --slug anythingllm
```

Then open `raw/anythingllm/extractor_output.json` and `dataset/anythingllm.json`
and actually read them. This repo's automated tests (below) prove the Python
logic is correct; they cannot prove your specific Opencode version + model
produces good extractions — only a human read of real output can. Add 10-15
more hand-picked, hand-verified tools as a permanent regression/golden set
before trusting this at scale.

## Batch run

```bash
python3 scripts/pipeline.py --tools config/tools.csv
# or stage by stage:
python3 scripts/fetch_github.py     --tools config/tools.csv --out raw/
python3 scripts/run_extractor.py    --tools config/tools.csv --raw-dir raw/
python3 scripts/merge_and_validate.py --tools config/tools.csv --raw-dir raw/ --out-dir dataset/
python3 scripts/build_dataset.py    --dataset-dir dataset/ --out dataset.json
```

Re-running is cheap and safe:
- Lane A uses ETag conditional requests — unchanged repos cost 0 rate-limit budget.
- Lane B skips re-extraction when the README + GitHub description are unchanged
  (content-hash check). Use `--force` to override.
- `merge_and_validate.py` preserves `featured`, `community_notes`,
  `community_guides`, and `date-added` from the existing record on every
  re-run — manual curation is never overwritten by a pipeline run.

## Where things land

```
raw/<slug>/github.json            Lane A output + audit metadata
raw/<slug>/readme.md              cached README used for extraction
raw/<slug>/extractor_output.json  Lane B output + source hash
raw/_failures.jsonl               Lane A failures (repo not found, etc.)
raw/_manual_review.jsonl          Lane B extractions that never passed validation
dataset/<slug>.json               merged, schema-valid final record
dataset/<slug>.confidence.json    per-field confidence from Lane B, if any "low"/"medium"
dataset.json                      final array — the deliverable
```

Check `raw/_manual_review.jsonl` after every batch run. Anything in there was
deliberately NOT shipped rather than shipped as a guess — that's it working
correctly, not a bug, but it needs a human to resolve.

## Known limitations — read before treating this as finished

1. **Opencode's exact `--format json` event shape wasn't verified against a
   live run** when this was written (no Opencode install / provider
   credentials in that environment). `extract_structured_payload()` in
   `run_extractor.py` uses multiple extraction strategies gated by schema
   validation, so a parsing miss fails safely into manual review rather than
   shipping garbage — but run `--debug-raw` on your first real tool and
   read `raw/<slug>/_opencode_raw_stdout.txt` to confirm it's finding the
   payload, not just correctly finding nothing.
2. **`tag` is ambiguous** in the schema you provided (it duplicated `license`
   in your sample record). Left as an LLM-classified single category label,
   separate from license — revisit this before scaling.
3. **`community_notes` / `community_guides` are not populated by this
   pipeline.** They're user-generated content from outside GitHub and need
   their own sourced ingestion process with its own citation trail. They
   default to `[]` and are preserved once you (or another process) fill them.
4. **`commercial_use` from `config/license_policy.json` is an operational
   heuristic, not legal advice** — it's unset (`null`) for any SPDX id not in
   the lookup table, by design, rather than guessed.
5. **`maturity` and `setup_difficulty` are LLM judgment calls.** They come
   back with a `field_confidence` tag; treat `"low"`/`"medium"` entries in
   `dataset/<slug>.confidence.json` as a to-review queue, not ground truth.

## Golden test set

Before running this on your full tool list, hand-verify a small fixed set of
repos (aim for variety: different licenses, languages, with/without Docker,
with/without a homepage) and keep their expected `dataset/<slug>.json` output
checked into version control. Re-diff against it whenever you touch
`extractor.md` or the schemas, so a prompt tweak that silently degrades
quality on one tool shows up before it ships to the whole batch.
