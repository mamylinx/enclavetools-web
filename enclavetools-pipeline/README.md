# Enclavetools dataset pipeline

The pipeline fetches repository metadata from GitHub or Hugging Face. Codex
then generates descriptions and classifies capabilities using the cached
metadata and README.

## Setup

From the pipeline folder, install the Python dependencies and sign in to a
current version of the Codex CLI.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
codex login
```

Set `GITHUB_TOKEN` in your shell for a higher GitHub rate limit on batch runs.
Codex runs with its default model unless you pass `--model`.

## First run

```bash
trial_dir=$(mktemp -d)
python scripts/pipeline.py --tools config/tools.csv --slug anythingllm \
  --raw-dir "$trial_dir/raw" --dataset-dir "$trial_dir/dataset" \
  --out "$trial_dir/dataset.json"
```

Review `$trial_dir/raw/anythingllm/extractor_output.json` and
`$trial_dir/dataset/anythingllm.json`. Use `--skip-fetch` only when the raw
directory already contains the tool's fetched metadata. Use `--force` to
regenerate a cached extraction.

## Batch run

```bash
python3 scripts/pipeline.py --tools config/tools.csv --model gpt-6.1-terra --jobs 3
# or stage by stage:
python3 scripts/fetch_github.py     --tools config/tools.csv --out raw/
python3 scripts/run_extractor.py    --tools config/tools.csv --raw-dir raw/ --jobs 3
python3 scripts/merge_and_validate.py --tools config/tools.csv --raw-dir raw/ --out-dir dataset/
python3 scripts/build_dataset.py    --dataset-dir dataset/ --out dataset.json
```

`--jobs` sets the maximum number of simultaneous Codex extractions and defaults
to 1. Fetching stays serial. The pipeline merges and builds the dataset after
all extraction jobs finish.

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

1. **Codex outputs need review.** The extractor validates the final JSON
   against the schema. To diagnose a failed extraction, run
   `scripts/run_extractor.py --force --debug-raw` with the usual arguments.
   The script writes Codex stdout and stderr to
   `raw/<slug>/_codex_raw_stdout.txt` and `raw/<slug>/_codex_raw_stderr.txt`.
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
`config/extractor_prompt.md` or the schemas, so a prompt tweak that silently degrades
quality on one tool shows up before it ships to the whole batch.
