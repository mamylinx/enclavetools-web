# Due Diligence Process — Offline AI Tools Directory

**Version:** 1.0  
**Status:** Production Reference  
**Scope:** Tool discovery, license review, offline verification, and listing qualification for a public directory of open-source offline/private AI tools.

---

## Table of Contents

1. [Overview](#overview)
2. [Definitions](#definitions)
3. [Stage 1 — Discovery](#stage-1--discovery)
4. [Stage 2 — License Review](#stage-2--license-review)
5. [Stage 3 — Offline Verification](#stage-3--offline-verification)
6. [Stage 4 — Hardware & Runtime Validation](#stage-4--hardware--runtime-validation)
7. [Stage 5 — Maintenance & Health Signals](#stage-5--maintenance--health-signals)
8. [Stage 6 — Dependency & Supply Chain Check](#stage-6--dependency--supply-chain-check)
9. [Stage 7 — Human Review Queue](#stage-7--human-review-queue)
10. [Data Schema](#data-schema)
11. [Pipeline Architecture](#pipeline-architecture)
12. [Known Limitations](#known-limitations)
13. [Priority Roadmap](#priority-roadmap)

---

## Overview

This document defines the end-to-end due diligence process for evaluating, verifying, and listing offline AI tools in the directory. The process is designed to be:

- **Accurate** — claims made in listings must be verifiable against source evidence
- **Scalable** — stages are either automatable or structured for efficient manual review
- **Transparent** — methodology is public so users understand what "verified" means

The directory's core value proposition is trust. A tool listed here must genuinely run offline without undisclosed network activity. This process exists to substantiate that claim.

---

## Definitions

| Term | Definition |
|---|---|
| **Offline tool** | A tool that performs its primary function (inference, transcription, embedding, etc.) without requiring an internet connection at runtime |
| **Network call** | Any outbound TCP/UDP connection made by the tool process or its dependencies during runtime |
| **Telemetry** | Any automatic data transmission to a remote server, including anonymous usage analytics |
| **Update check** | A network call made to verify or retrieve a newer version of the tool or its models |
| **SPDX identifier** | A standardized license expression as defined by the SPDX Working Group (e.g., `MIT`, `Apache-2.0`, `GPL-3.0-only`) |
| **Source-available** | Code that is publicly readable but does not meet OSI open-source criteria (e.g., BSL 1.1, SSPL) |
| **Stale** | A repository with no commits in the last 12 months |
| **Archived** | A repository explicitly marked as archived by its maintainer |

---

## Stage 1 — Discovery

### Objective

Identify candidate tools from authoritative, high-signal sources. Minimize false positives (SaaS tools misrepresented as offline).

### Sources

| Source | Method | Signal Quality | Notes |
|---|---|---|---|
| GitHub Topics | API query (`topic:local-llm`, `topic:offline-ai`, `topic:on-device`) | High | Primary source. Results reflect community tagging. |
| GitHub Search | Keyword search in repo name/description | Medium | Higher noise; requires filtering |
| Hugging Face Hub | Filter `inference_api: false` via Hub API | High | Underused source; directly relevant to offline inference |
| Product Hunt | Manual or scraper-assisted search | Medium | Useful for newer tools; noisy with SaaS entries |
| Curated Awesome Lists | Periodic scrape of `awesome-local-llm`, `awesome-privacy` etc. | Medium | Good seed data; staleness varies by list |
| Community sources | Reddit (`r/LocalLLaMA`, `r/selfhosted`), Discord | Low–Medium | Qualitative signal; not automated |

### Discovery Criteria (Pass to Stage 2)

A candidate passes discovery if it meets **all** of the following:

- Has a public source code repository
- Primary function is AI-related (inference, embedding, STT, TTS, vision, etc.)
- README or documentation makes an explicit claim of offline or local operation
- Repository is not archived

### Output

A structured candidate record containing:

```
repo_url
name
description
discovered_via (source name)
discovery_date
readme_offline_claim (boolean)
```

---

## Stage 2 — License Review

### Objective

Determine the license governing the tool's source code and classify it for user clarity. Flag licenses incompatible with the directory's inclusion criteria.

### Tools Used

| Tool | Role | Notes |
|---|---|---|
| [ScanCode Toolkit](https://github.com/nexB/scancode-toolkit) | Detects license expressions across source files | CLI-based; produces SPDX/JSON output |
| [FOSSology](https://www.fossology.org/) | Stores scan history; generates SPDX and CycloneDX reports | Requires hosted instance; suitable for audit trails at scale |

### Process

**Step 1 — Clone the repository**

```bash
git clone --depth=1 <repo_url> ./candidate/<tool_name>
```

Use `--depth=1` to limit data transfer for large repositories.

**Step 2 — Run ScanCode**

```bash
scancode --license --copyright --json-pp output.json ./candidate/<tool_name>
```

Key output fields:
- `license_expressions` — detected SPDX expressions
- `license_clarity_score` — confidence score (0–100); flag anything below 60 for manual review
- `copyright` — copyright holders

**Step 3 — Normalize to SPDX identifier**

Map the detected expression to a canonical SPDX identifier. If ScanCode returns multiple conflicting expressions, flag for human review.

**Step 4 — Classify license tier**

Apply the following classification:

| Tier | Examples | Directory Implication |
|---|---|---|
| **Permissive** | MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC | Listed without restriction |
| **Copyleft** | GPL-2.0, GPL-3.0, AGPL-3.0, LGPL | Listed; copyleft nature surfaced to user |
| **Source-Available** | BSL-1.1, SSPL-1.0, Commons Clause | Listed with explicit "Not OSI-approved" label |
| **Proprietary / Unknown** | No license file, custom restrictive license | Excluded by default; flagged for human review |

> **Note on AGPL-3.0:** The network use clause in AGPL means that services *exposing* the tool over a network must release source. For purely local/offline use, this clause does not apply. This distinction should be surfaced in the listing.

**Step 5 — Check for license conflicts**

If the tool bundles dependencies under different licenses, check for compatibility. A common conflict: a MIT-licensed tool bundling a GPL dependency. ScanCode's `--license` flag covers bundled files if they are present in the repository.

### Exclusion Criteria

Exclude from the directory if:

- No license file is present and no license is declared in `package.json`, `pyproject.toml`, or equivalent
- License explicitly prohibits local/offline deployment
- License contains a field-of-use restriction incompatible with general availability (e.g., non-commercial only with no free-use carve-out)

### Output Fields

```
license_spdx          # e.g., "Apache-2.0"
license_tier          # Permissive / Copyleft / Source-Available / Proprietary
license_clarity_score # 0–100 from ScanCode
license_notes         # Any ambiguities or bundled license conflicts
license_scan_date
```

---

## Stage 3 — Offline Verification

### Objective

Confirm that the tool's core functionality operates without network access and identify any undisclosed network calls (telemetry, update checks, model downloads).

> This is the most important stage and the primary differentiator of this directory. It cannot be fully automated without a sandboxed execution environment.

### Environment Setup

Use a network-isolated virtual machine or container:

**Option A — iptables-based isolation (Linux VM)**

```bash
# Block all outbound traffic except loopback
iptables -P OUTPUT DROP
iptables -A OUTPUT -o lo -j ACCEPT

# Start network capture
tcpdump -i any -w capture.pcap &
```

**Option B — Docker with network disabled**

```bash
docker run --network none <image> <tool_invocation>
```

**Option C — mitmproxy (for TLS-inspected traffic)**

```bash
mitmproxy --mode transparent
# Route tool traffic through proxy
# Captures both plaintext and TLS-terminated connections
```

Option C is preferred for tools using HTTPS, as `tcpdump` alone cannot inspect encrypted payloads.

### Verification Steps

1. **Install the tool** in the isolated environment (internet temporarily enabled for install only)
2. **Sever network access** after installation and before first launch
3. **Run the tool** through its primary workflow (model load → inference → output)
4. **Capture traffic** throughout the session
5. **Analyze captures** for any outbound connection attempts

### Classification of Network Activity

| Classification | Description | Listing Treatment |
|---|---|---|
| `none` | No outbound connections detected | ✅ Verified offline |
| `update-check-only` | Connects only to check for updates; not required for function | ⚠️ Listed with note; update check is non-blocking |
| `telemetry` | Sends usage data to a remote server | ⚠️ Listed with explicit telemetry disclosure; opt-out instructions if available |
| `model-download-required` | Cannot function without downloading model weights at runtime | ❌ Excluded or listed under a separate "requires initial download" category |
| `unknown` | Connections detected but purpose unclear | 🔍 Flagged for deeper analysis before listing |

### Evidence Preservation

For each verified tool, retain:

- `capture.pcap` — raw network capture
- `verification_notes.md` — environment, tool version, commands run, findings
- `verified_by` — reviewer identifier
- `verified_date`

### Re-verification Trigger

Re-verify when:

- A new major version is released
- A changelog entry references networking, telemetry, or analytics
- A community report alleges undisclosed network activity

---

## Stage 4 — Hardware & Runtime Validation

### Objective

Provide accurate, tested hardware requirements. User-submitted or README-stated specs are frequently aspirational or outdated.

### Data Collection

**Primary (required):**

- Minimum RAM (GB) to load and run the tool
- Whether CPU-only operation is supported (no GPU required)
- OS support matrix (Windows / macOS / Linux; x86-64 / ARM64)

**Secondary (collected where testable):**

- Minimum VRAM (GB) for GPU-accelerated operation
- Tested devices (e.g., "Tested on Raspberry Pi 5", "Tested on M2 MacBook Air")
- Quantization levels supported (e.g., Q4_K_M, INT8)

### Sources (in priority order)

1. Reviewer's own hardware test (highest trust)
2. Documented community reports with hardware specifications cited
3. Official README or documentation (lowest trust; must be flagged as "per documentation, untested")

### Output Fields

```
min_ram_gb
min_vram_gb           # null if GPU not required
cpu_only_capable      # boolean
os_windows            # boolean
os_macos              # boolean
os_linux              # boolean
arch_x86_64           # boolean
arch_arm64            # boolean
hardware_notes        # e.g., "Runs on Raspberry Pi 5 with 8GB RAM at Q4 quantization"
hardware_source       # "reviewer_tested" | "community_reported" | "documentation"
```

---

## Stage 5 — Maintenance & Health Signals

### Objective

Surface the current maintenance state of the tool so users can make informed decisions. A tool that was active 18 months ago may have since added cloud dependencies or become unmaintained.

### Signals Collected (GitHub API)

| Signal | Field | How Collected |
|---|---|---|
| Last commit date | `pushed_at` | GitHub REST API `/repos/{owner}/{repo}` |
| Open issues count | `open_issues_count` | GitHub REST API |
| Release cadence | Latest release date | GitHub REST API `/repos/{owner}/{repo}/releases/latest` |
| Archived status | `archived` | GitHub REST API |
| Star count | `stargazers_count` | GitHub REST API (popularity proxy only) |
| Contributor count | Contributors endpoint | GitHub REST API |

### Maintenance Status Classification

| Status | Criteria |
|---|---|
| **Active** | Commit within last 90 days |
| **Slow** | Last commit 90–365 days ago |
| **Stale** | Last commit 12–24 months ago; not archived |
| **Archived** | Repository explicitly archived by maintainer |

### Changelog Monitoring

Subscribe to releases via GitHub API or RSS (`/releases.atom`) for each listed tool. Flag changelogs containing terms:

```
telemetry, analytics, tracking, beacon, ping, cloud, remote, online, network
```

Flag triggers a re-verification (Stage 3) before the next listing update.

### Output Fields

```
last_commit_date
open_issues_count
release_cadence_days    # average days between releases (last 5)
maintenance_status      # Active / Slow / Stale / Archived
health_last_checked
```

---

## Stage 6 — Dependency & Supply Chain Check

### Objective

Identify known security vulnerabilities in dependencies and detect dependencies capable of initiating network connections at runtime.

### Vulnerability Scanning

| Ecosystem | Tool | Command |
|---|---|---|
| Python | pip-audit | `pip-audit -r requirements.txt` |
| Node.js | npm audit | `npm audit --json` |
| Rust | cargo audit | `cargo audit` |
| Go | govulncheck | `govulncheck ./...` |

Flag any dependency with a CVSS score ≥ 7.0 (High or Critical). Do not exclude tools for vulnerabilities in dev dependencies not present in production builds.

### Network-Capable Dependency Detection

Scan `requirements.txt`, `package.json`, `go.mod`, or `Cargo.toml` for dependencies known to perform outbound requests:

- Python: `requests`, `httpx`, `urllib3`, `aiohttp`
- Node.js: `axios`, `node-fetch`, `got`, `undici`

Presence of these packages does not disqualify a tool but triggers a review of *how* they are used. Check whether they are used at runtime or only during setup/install.

> This check is complementary to Stage 3 (network capture), not a replacement. Dependency analysis is static; network capture is dynamic.

### Output Fields

```
vuln_scan_result        # clean / flagged
vuln_cve_ids            # list of CVE IDs if flagged
vuln_scan_date
network_deps_detected   # boolean
network_deps_notes      # which dependencies and their apparent use
```

---

## Stage 7 — Human Review Queue

### Objective

Resolve ambiguous cases that automated stages cannot handle definitively. Maintain a record of decisions.

### Cases Routed to Human Review

- `license_clarity_score` below 60
- License tier is `Source-Available` or `Proprietary`
- Network capture result is `unknown`
- Conflicting signals between README claims and runtime behavior
- Changelog mentions networking-related changes
- Community report of undisclosed behavior

### Review Record

Each human review decision must be recorded with:

```
tool_id
review_date
reviewer
issue_description
decision           # Approve / Reject / Pending / Request-Info
decision_rationale
evidence_links
```

---

## Data Schema

The canonical listing record. All fields must be populated before a tool is published. Fields marked `(auto)` are populated by the pipeline; fields marked `(manual)` require reviewer input.

```json
{
  "tool_id": "string (slug)",
  "name": "string",
  "description": "string",
  "repo_url": "string",
  "website_url": "string | null",
  "category": ["LLM", "STT", "TTS", "Vision", "Embedding", "RAG", "Other"],

  "license_spdx": "string (e.g., Apache-2.0)",
  "license_tier": "Permissive | Copyleft | Source-Available | Proprietary",
  "license_clarity_score": "integer 0–100",
  "license_notes": "string | null",
  "license_scan_date": "ISO 8601 date",

  "offline_verified": "boolean",
  "network_calls_on_runtime": "none | update-check-only | telemetry | model-download-required | unknown",
  "network_calls_notes": "string | null",
  "verification_date": "ISO 8601 date",
  "verification_method": "network-capture | sandboxed-docker | manual-observation",

  "min_ram_gb": "number",
  "min_vram_gb": "number | null",
  "cpu_only_capable": "boolean",
  "os_windows": "boolean",
  "os_macos": "boolean",
  "os_linux": "boolean",
  "arch_x86_64": "boolean",
  "arch_arm64": "boolean",
  "hardware_source": "reviewer_tested | community_reported | documentation",
  "hardware_notes": "string | null",

  "last_commit_date": "ISO 8601 date",
  "maintenance_status": "Active | Slow | Stale | Archived",
  "open_issues_count": "integer",

  "vuln_scan_result": "clean | flagged",
  "vuln_cve_ids": ["string"],
  "network_deps_detected": "boolean",

  "data_sources": ["github", "huggingface", "producthunt", "manual"],
  "listing_status": "Published | Draft | Rejected | Pending-Reverification",
  "listing_created_date": "ISO 8601 date",
  "listing_last_updated": "ISO 8601 date"
}
```

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────┐
│              DISCOVERY LAYER                │
│  GitHub API  ·  HuggingFace API  ·  Scraper │
│         ↓ Dedup + Store Candidates          │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           STATIC ANALYSIS LAYER             │
│  ScanCode → SPDX → License Classifier       │
│  GitHub API → Health Signals                │
│  pip-audit / npm audit → Vuln Scan          │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         DYNAMIC VERIFICATION LAYER          │
│  Sandboxed VM / Docker (network isolated)   │
│  mitmproxy / tcpdump → Network Capture      │
│  Manual hardware test or community reports  │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────▼─────────┐
        │  HUMAN REVIEW     │
        │  QUEUE            │
        │  (flagged cases)  │
        └─────────┬─────────┘
                  │
┌─────────────────▼───────────────────────────┐
│             PUBLISHED LISTING               │
│  Structured JSON / DB → Directory Frontend  │
└─────────────────────────────────────────────┘
```

### Scheduling

| Task | Frequency |
|---|---|
| Discovery crawl | Weekly |
| Health signal refresh (GitHub API) | Weekly |
| Vulnerability re-scan | Monthly |
| Full re-verification (network capture) | On major version release or changelog flag |
| Human review queue processing | As needed; target < 5 business days |

---

## Known Limitations

**Sandbox escape detection is incomplete.** A sufficiently sophisticated tool could detect sandboxed environments and suppress network activity during testing. This is a known limitation of dynamic analysis and is not unique to this process.

**Hardware requirements degrade over time.** As quantization and optimization improve, stated minimum specs may become conservative. Re-testing is not triggered automatically and depends on community or reviewer reports.

**FOSSology requires hosted infrastructure.** For early-stage operation, ScanCode CLI writing to a Postgres database is a more practical alternative. FOSSology becomes valuable when audit trail depth and SBOM generation are required.

**ARM and low-cost device testing is constrained by reviewer hardware access.** Hardware notes for non-x86 platforms rely more heavily on community reports than reviewer-tested results.

**Changelog monitoring has false positives.** Terms like "network" may appear in release notes in non-privacy-relevant contexts. All flags require human triage before triggering re-verification.

---

## Priority Roadmap

| Phase | Deliverable | Dependency |
|---|---|---|
| **1** | Define and implement data schema in database | None |
| **2** | GitHub API discovery pipeline (automated, scheduled) | Schema |
| **3** | ScanCode integration + license classifier | Schema |
| **4** | Manual offline verification for first 20–30 listings | Sandbox environment |
| **5** | GitHub health signal monitoring (automated) | Discovery pipeline |
| **6** | Vulnerability scanning integration | Schema |
| **7** | Automated sandbox-based network verification | Engineering bandwidth |
| **8** | FOSSology deployment for audit trail | Infrastructure |

Phases 1–5 are sufficient for a credible public launch. Phases 6–8 increase rigor and reduce manual workload at scale.

---

*This document should be reviewed and updated whenever a new tool category is added, tooling changes, or a significant gap in the process is identified.*
