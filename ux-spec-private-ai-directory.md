# UX Specification — Private & Offline AI Tools Directory
## For an audience who cannot afford data leaks

**Document type:** Persona scenarios + complete UX specification  
**Version:** 1.0  
**Scope:** Discovery → Tool detail → Decision → Return visit

---

# PART ONE — PERSONA SCENARIOS

---

## PERSONA A — The Indie Hacker

**Name:** Marcus, 34  
**Context:** Solo founder building a SaaS product. He wants to embed an LLM into his app to power a "smart search" feature, but his users are in the healthcare-adjacent space and he cannot send their queries to OpenAI. He has limited time, intermediate dev skills (Node.js, some Python), a $0–$200/month budget for infrastructure, and no ML background. He found the directory via a Hacker News thread titled "Show HN: I built a directory of offline AI tools."

---

### Marcus's Full Scenario

**Entry point:** Hacker News link → lands on homepage, 10:45pm on a Tuesday.

He reads the headline and subtitle in under 4 seconds. His first question: *"Is this going to solve my exact problem or is this another general AI resource?"* He scans for a category or filter that signals "embedding LLMs into apps" or "self-hosted inference." He sees a category called **"Inference Engines"** and a tag **"embeddable"**. He clicks that filter.

He gets a list of 12 tools. He doesn't read any descriptions yet — he looks at the **star count on GitHub** (shown inline), the **last commit date**, and the **language badge**. He ignores anything with last commit > 6 months ago. He ignores anything in Rust (he can't debug it). He shortlists 3 tools: two with Python APIs, one with a REST API wrapper.

He clicks the first tool. The detail page loads. He immediately scrolls past the description to look for **"How to install"** or a **"Quickstart"** section. He finds a code snippet. He copies it. Then he checks the **hardware requirements**: it says "minimum 8GB RAM." His dev laptop is 16GB — okay. He checks if there's a **Docker option** (yes). He opens the GitHub link in a new tab.

He goes back to the directory and clicks the second tool. He notices a **comparison widget** linking tools A vs. tool B on three dimensions: RAM usage, latency, and REST API availability. He uses that to eliminate tool A and bookmark tool B.

He then searches the directory with the text query **"REST API"** to see if there are wrappers or middleware tools that sit in front of inference engines. He finds 2 results. One of them has a **"works with"** tag linking back to the tool he just bookmarked. He opens it. This is a combination he can actually use.

He wants to save his shortlist. He sees a **"Save to collection"** feature — it requires an email. He pauses. He's privacy-conscious. He sees a note: *"Collections are stored locally in your browser. Email is optional and used only for sync across devices."* He proceeds without giving his email.

At 11:30pm he closes his laptop. The next day he returns via direct URL he bookmarked. His collection is still there (localStorage). He clicks the **"How others use this"** section on the tool page — it shows 3 community-submitted use cases. One matches his situation almost exactly (SaaS with multi-tenant user data). He clicks the external link to the GitHub discussion. That's enough — he's decided.

**Total sessions:** 2  
**Total time on site:** ~38 minutes  
**Conversion event:** GitHub link clicked + local collection saved

---

## PERSONA B — The Business Owner

**Name:** Sandra, 51  
**Context:** Owns a 12-person legal document processing firm. She learned from her IT consultant that the firm's document review pipeline is sending contract text to a cloud AI API. Her lawyer told her this may violate client NDAs. She needs to find a self-hosted solution but has zero technical knowledge herself. She will share what she finds with her IT contractor. She found the directory via a Google search: *"open source AI tool no data sent to cloud."*

---

### Sandra's Full Scenario

**Entry point:** Google organic result → she lands on a landing page or homepage.

She reads the headline. She is immediately looking for proof that this site understands her problem. If the headline says something like *"AI tools that never send your data anywhere,"* she stays. If it looks like a GitHub link aggregator, she leaves.

She doesn't click any filters. She reads the hero text carefully. She notices a **"Who is this for?"** section with icons or tabs: Developer / Business Owner / Professional / Researcher. She clicks **"Business Owner."** The page reconfigures to show tools grouped by use case: Document Processing, Meeting Transcription, Internal Search, Customer Support.

She clicks **"Document Processing."** She sees 4 tools. She does not understand what "LLaMA" or "quantized model" means. She looks for:
- A plain-English description of what the tool does
- Whether setup requires a developer
- Whether there's a commercial license
- Whether there's paid support available

She finds one tool that has a badge: **"No-code setup available"** and another that says **"Commercial use: allowed."** She reads the plain-English summary: *"Runs on your own computer or server. Reads PDF and Word documents. Answers questions about them. No internet connection required."* She understands this.

She clicks **"Share this tool"** and gets a clean shareable link. She copies it into an email to her IT contractor with her notes pasted below. She also screenshots the **"Privacy guarantee"** section of the tool page (which explains the tool's offline architecture in plain English).

She tries the search bar, types **"contract review."** Results appear. She sees the results are tagged: one says **"Technical setup required,"** another says **"Beginner friendly."** She filters for **"Beginner friendly"** and gets 2 results. She bookmarks both.

She never clicks GitHub links. She never reads a README. She does click **"Vendor website"** when it's available — she wants to see if the company looks professional and whether there's a phone number.

She returns to the site 4 days later after her IT contractor responds. He mentioned a specific tool name. She types it in the search bar directly, finds it, and sends him the tool page link.

**Total sessions:** 3  
**Total time on site:** ~22 minutes across sessions  
**Conversion event:** Shareable link sent to contractor + tool name searched directly on return

---

## PERSONA C — The Developer

**Name:** Priya, 28  
**Context:** Backend engineer at a mid-size fintech company. She's been tasked by her CTO to evaluate self-hosted LLM options for an internal compliance Q&A bot. Requirements: must run on-prem on their existing GPU servers (NVIDIA A100s), must expose an OpenAI-compatible API (so their existing toolchain doesn't break), must support fine-tuning on internal policy docs. She has 2 weeks to deliver a recommendation report. She found the directory via a colleague's Slack message.

---

### Priya's Full Scenario

**Entry point:** Slack link → lands on homepage, opens immediately in her work browser.

She does not read the hero text. She goes straight to the filter panel. She applies:
- Category: **Inference Engines**
- Hardware: **GPU / CUDA**
- Feature: **OpenAI-compatible API**
- Feature: **Fine-tuning support**

She gets 5 results. She opens all 5 in new tabs (cmd+click).

For each tool she checks:
1. **License** (Apache 2.0? MIT? AGPL? — AGPL is a dealbreaker for internal commercial use)
2. **Model compatibility list** (does it support Mistral, LLaMA 3, Phi?)
3. **Last release date** and **release cadence**
4. **GitHub stars trajectory** (not just total stars — she wants to see if it's growing)
5. **REST API documentation link**
6. **Community activity** (Discord link, number of open issues)

She notices the directory shows a **"Technical scorecard"** section: a structured table with rows for License, API type, GPU support, Docker support, fine-tuning, quantization support. She uses this to eliminate 2 tools in under 60 seconds.

She finds a **"Compare"** feature. She selects 3 remaining tools and clicks Compare. A side-by-side table appears with all technical attributes. She screenshots it for her report.

She notices one tool lacks a quantization row in the scorecard. She clicks **"Suggest a correction"** — a small inline form appears. She fills it in. She moves on.

She uses the directory's **RSS feed** (or an "email digest" for new tools matching her saved filters) to stay updated in case a new tool is added during her 2-week evaluation. She subscribes with her work email.

She finds one tool with a **"Community notes"** section — other developers have left structured notes: *"Works on A100 with bf16, had to patch the config manually — see this PR."* This is the most useful content on the page. She copies the PR link.

She finishes her session in 25 minutes. She returns 3 days later to check if the tool she flagged for correction has been updated (it has). She exports her comparison table as a **PDF or CSV** for her CTO presentation.

**Total sessions:** 2  
**Total time on site:** ~45 minutes total  
**Conversion event:** Comparison table exported + filter alert subscribed

---

## PERSONA D — The Professional (Physician)

**Name:** Dr. Alain, 47  
**Context:** Cardiologist in a private clinic. He wants to use an AI assistant to help him draft clinical notes and look up drug interactions during consultations — offline, on his local machine, with no patient data ever leaving the clinic network. He's not technical at all. He has a MacBook Pro M2. He found the directory via a medical professional forum where a colleague posted a link.

---

### Dr. Alain's Full Scenario

**Entry point:** Forum link → lands on homepage.

He reads the headline. He's cautious — he's been burned by "HIPAA-compliant" cloud tools before that turned out to still send metadata. He looks immediately for **trust signals**: Is this a known organization? Are there mentions of HIPAA or medical use? He sees a **"Use cases"** section and clicks **"Healthcare / Clinical."**

He sees 3 tools tagged for clinical/medical use. Each has a plain-English card: what it does, what device it runs on, whether it needs internet after setup. One card says: *"Runs entirely on Mac. Works offline after one-time model download. No account required."* He reads this twice.

He clicks that tool's detail page. The first thing he looks for is **"Does it store anything?"** He finds a **"Data & Privacy"** section written in plain language (not legal jargon): *"This tool stores nothing to disk unless you explicitly save a session. No telemetry. No cloud sync. No license server calls."* He reads it fully.

He then asks: **"Can I use this without a developer?"** He sees a section: **"Setup difficulty: Low — GUI available."** There is a macOS download button. He clicks it. He's taken to the GitHub releases page. He's slightly lost — he sees multiple files and doesn't know which one to download. He goes back to the directory.

He notices a **"Community guides"** link — he clicks it and finds a user-submitted guide titled *"Installing [Tool Name] on macOS M2 — step by step, no terminal needed."* He bookmarks this.

He's not sure if this tool can handle medical terminology. He looks for **"Supported languages / domains"** and finds a tag: **"General purpose — not domain-specific."** This worries him. He checks the other 2 tools. One says **"Medical terminology: community-tested"** with a link to a forum thread. He opens it.

He wants to ask a question. He notices a **"Ask the community"** button. He types: *"Can this tool understand cardiology abbreviations like AV block or STEMI?"* He submits it. He gets an email notification 6 hours later when someone replies.

He returns the next morning. He reads the reply. He's satisfied. He downloads the tool using the guide.

**Total sessions:** 3 (plus email notification interaction)  
**Total time on site:** ~30 minutes across sessions  
**Conversion event:** External guide link clicked + community question submitted

---

# PART TWO — COMPLETE UX SPECIFICATION

---

## 1. INFORMATION ARCHITECTURE

### 1.1 Site Map

```
Homepage
├── Browse (main directory)
│   ├── Filter panel (persistent sidebar or top bar)
│   ├── Tool cards (list / grid toggle)
│   └── Comparison mode (triggered from cards)
├── Tool Detail Page
│   ├── Overview section
│   ├── Technical scorecard
│   ├── Data & Privacy section
│   ├── Setup guide section
│   ├── Hardware requirements
│   ├── Community notes
│   ├── Related tools
│   └── Suggest a correction
├── Categories (landing pages per category)
│   ├── Inference Engines
│   ├── Model Management
│   ├── UI / Chat Interfaces
│   ├── Document Processing
│   ├── Voice / STT / TTS
│   ├── Embeddings & Vector Stores
│   ├── Fine-tuning Tools
│   └── Orchestration / Agents
├── Use Cases (persona-oriented entry)
│   ├── Business Owner
│   ├── Developer / Engineer
│   ├── Healthcare Professional
│   ├── Legal Professional
│   └── Indie Hacker / Solo Builder
├── Compare (tool comparison page)
├── Collections (saved tools, localStorage-first)
├── Submit a Tool
├── Community Notes / Guides
└── About / Trust page
```

### 1.2 Content Model — Tool Entry

Each tool in the directory has a defined, structured data schema:

| Field | Type | Required | Notes |
|---|---|---|---|
| Name | string | yes | |
| Tagline | string (≤120 chars) | yes | Plain English, no jargon |
| Plain-English description | string (≤300 chars) | yes | Written for non-developers |
| Technical description | string (≤500 chars) | yes | For developers |
| Category | enum (list) | yes | One primary |
| Tags | array of strings | yes | Multiple |
| License | enum | yes | MIT, Apache 2, GPL, AGPL, BSL, other |
| Commercial use | boolean | yes | |
| GitHub URL | URL | yes | |
| GitHub stars | integer | auto-fetched | Updated daily |
| Last commit date | date | auto-fetched | |
| Release cadence | enum | auto-derived | Active / Slow / Archived |
| Primary language | string | yes | |
| Hardware: CPU-only | boolean | yes | |
| Hardware: GPU required | boolean | yes | |
| Hardware: GPU optional | boolean | yes | |
| Hardware: CUDA support | boolean | yes | |
| Hardware: Metal (Apple) support | boolean | yes | |
| Hardware: min RAM | integer (GB) | yes | |
| Hardware: recommended RAM | integer (GB) | no | |
| Docker available | boolean | yes | |
| OpenAI-compatible API | boolean | yes | |
| REST API | boolean | yes | |
| Fine-tuning support | boolean | yes | |
| Quantization support | boolean | yes | |
| Offline after setup | boolean | yes | |
| Telemetry | enum | yes | None / Optional / On by default |
| Vendor website | URL | no | |
| Paid support available | boolean | yes | |
| No-code / GUI available | boolean | yes | |
| Setup difficulty | enum | yes | Low / Medium / High |
| Use case tags | array of enums | yes | e.g. Document Processing, Clinical Notes |
| Persona tags | array of enums | yes | e.g. Business Owner, Developer |
| Community notes count | integer | auto | |
| Community guides count | integer | auto | |
| Date added to directory | date | auto | |
| Last verified date | date | yes | Human-verified accuracy |

---

## 2. PAGE-BY-PAGE SPECIFICATION

---

### 2.1 Homepage

**Purpose:** Orient any persona within 5 seconds, provide immediate onramp to their task.

**Layout structure (top to bottom):**

**A. Navbar**
- Logo + site name (left)
- Nav links: Browse, Use Cases, Compare, Submit a Tool (center)
- Search bar (always visible, right of nav) — NOT hidden behind an icon
- No account/login required to access core features

**B. Hero section**
- Headline: Direct, benefit-first, privacy-focused. One line.
- Subheadline: Who this is for + what the directory contains. Two sentences max.
- Primary CTA: "Browse all tools" → goes to Browse page
- Secondary CTA: "Find tools for my use case" → goes to Use Cases page
- Trust bar below CTAs: 3 inline statistics (e.g. "142 tools listed," "Updated weekly," "Community-verified") — these must be real, never fabricated.

**C. Persona entry strip**
- 4–5 labeled entry points with icons: Developer, Business Owner, Healthcare, Legal, Indie Hacker
- Each links to a pre-filtered Browse view tuned for that persona
- No modal or overlay — direct navigation

**D. Category grid**
- 8 category tiles, each showing: category name, icon, tool count
- Clicking goes to filtered Browse view

**E. Featured / recently added tools**
- 3–4 tool cards (see card spec below)
- Label: "Recently added" or "Community picks" — never "AI-curated" or "Trending" unless that's verifiable

**F. Footer**
- About, Submit a Tool, RSS feed, GitHub (if open source), Privacy policy

---

### 2.2 Browse Page

**Purpose:** Primary discovery interface. Must serve both filter-heavy power users and casual browsers.

**Layout:** Persistent left filter panel + main content area (tool cards)

**A. Filter Panel (left, always visible on desktop; collapsible on mobile)**

Filter groups (each collapsible):

1. **Category** — checkboxes, multi-select
2. **Use case** — checkboxes, multi-select
3. **Persona** — radio or checkboxes (Developer / Business Owner / Healthcare / Legal / Indie Hacker)
4. **Setup difficulty** — Low / Medium / High (checkboxes)
5. **Hardware** — CPU only / GPU optional / GPU required / Apple Silicon (checkboxes)
6. **License** — MIT / Apache 2 / GPL / AGPL / Other (checkboxes)
7. **Commercial use** — toggle (Yes / Any)
8. **Features** — checkboxes:
   - OpenAI-compatible API
   - REST API
   - Fine-tuning support
   - Quantization
   - Docker available
   - GUI / No-code
   - Paid support available
9. **Offline after setup** — toggle (Yes / Any)
10. **Telemetry** — None only / Any (toggle)
11. **Activity** — Active (commit < 3mo) / Any

Filter state: Reflected in URL query parameters so URLs are shareable and bookmarkable.

Active filters: Displayed as removable chips above the results list. One "Clear all" button.

**B. Search Bar** (top of content area)
- Full-text search across: name, tagline, tags, description
- Search results update without page reload
- Displays match count: "12 tools match your search and filters"

**C. Sort Options** (top right of content area)
- Options: Most stars, Recently added, Last updated, Setup difficulty (easiest first), Alphabetical

**D. View Toggle**
- List view (default): more text per card, good for reading
- Grid view: more cards visible, good for browsing

**E. Results Count**
- Always visible: "Showing 12 of 142 tools"

**F. Tool Cards (list view)**

Each card contains:
- Tool name (linked to detail page)
- Tagline (plain English, 1 line)
- Primary category badge
- 3 key feature badges (e.g. "CPU only," "OpenAI API," "MIT license") — most relevant to current filter context
- GitHub stars (number + small icon)
- Last commit date (relative: "3 days ago," "2 months ago")
- Setup difficulty indicator (color-coded dot or label: Low / Medium / High)
- "Add to compare" checkbox (appears on hover)
- "Save" icon (heart or bookmark, saves to local collection)

Cards do NOT show: GitHub README excerpts, long descriptions, screenshots.

**G. Comparison mode**
- Activated when 2+ cards have "Add to compare" checked
- A sticky bottom bar appears: "Comparing 2 tools — View comparison"
- Maximum 4 tools can be compared simultaneously
- Clicking "View comparison" opens the Compare page

**H. Empty state**
- When no results match filters: show which filters caused the reduction, suggest removing one
- Never show a blank page

**I. Pagination vs. infinite scroll**
- Pagination preferred (better for URL sharability, better for return visits)
- Default: 20 results per page
- Option to show 50 per page

---

### 2.3 Tool Detail Page

**Purpose:** Give every persona enough information to make a decision, at their level of technical depth.

**Layout:** Single column, anchored sections, sticky mini-nav on desktop

**Sticky mini-nav (desktop only):**
Overview | Technical | Privacy & Data | Setup | Hardware | Community | Related

**A. Header section**
- Tool name (H1)
- Tagline (plain English, 1 sentence)
- Key badges row: Category | License | Last updated | GitHub stars
- Action buttons: 
  - "View on GitHub" (external)
  - "Visit official site" (external, if available)
  - "Save to collection" (local, no login required)
  - "Share this page" (copies URL or opens share sheet)
  - "Add to compare"

**B. Overview section**
Two tabs or expandable sections:
- **Plain English** (default): Written for non-technical users. What does it do? What problem does it solve? Example: *"This tool runs an AI assistant on your own computer. After setup, it needs no internet connection. You can ask it questions and it responds like ChatGPT — but nothing leaves your machine."*
- **Technical**: For developers. Architecture, capabilities, limitations, known issues.

**C. Technical Scorecard**
A structured table — not prose. Scannable in 10 seconds.

| Attribute | Value |
|---|---|
| License | Apache 2.0 |
| Commercial use | Yes |
| OpenAI-compatible API | Yes |
| REST API | Yes |
| Fine-tuning support | Yes |
| Quantization support | GGUF, GPTQ |
| Docker available | Yes |
| GUI available | Yes (separate project) |
| Telemetry | None |
| Offline after setup | Yes |

**D. Data & Privacy section**
Written in plain language. Structured as answered questions:
- Does this tool send any data to the internet? → [Answer]
- Does it store conversation history? → [Answer]
- Does it phone home for license verification? → [Answer]
- Does it have telemetry or analytics? → [Answer]

Source: filled in by submitter, verified by maintainer, flagged if unverified.

**E. Setup & Installation section**
- Setup difficulty indicator: Low / Medium / High (with explanation of what that means)
- Prerequisites listed clearly (e.g. "Python 3.10+, 16GB RAM, NVIDIA GPU with CUDA 11+")
- Quick-start code snippet (if applicable) — syntax highlighted, copy button
- Link to official documentation
- Link to community guides (if any exist in the directory)
- Platform availability: macOS / Windows / Linux — shown as icons with yes/no/partial

**F. Hardware Requirements section**
| Attribute | Minimum | Recommended |
|---|---|---|
| RAM | 8 GB | 16 GB |
| GPU VRAM | None | 8 GB |
| Disk space | 4 GB | 20 GB |
| CPU | Any x86-64 | — |
| Apple Silicon | Yes | — |

**G. Compatible Models section**
List of LLM model families this tool supports (e.g. LLaMA 3, Mistral, Phi-3, Gemma).
Each model family links to its model card or HuggingFace page.
Badge if any model is "beginner recommended."

**H. Works Well With section**
Other tools in the directory that complement this one (e.g. a UI front-end that pairs with this inference engine).
Shown as small linked cards. Maximum 4.

**I. Community Notes section**
User-submitted structured notes. Each note has:
- A category tag: Bug/workaround / Configuration tip / Use case / Hardware-specific
- Short text (≤ 300 chars)
- Upvote count
- Date submitted
- Optional: link to external source (GitHub issue, forum post)

Notes are NOT a comment system. No threading. No replies. Upvote only.
Moderated: spam and incorrect information can be flagged.

**J. Community Guides section**
Links to user-submitted external guides (tutorials, blog posts, YouTube videos).
Each entry: title, author, format (article / video / GitHub), date, brief description.
Submitted via a simple form.

**K. Suggest a Correction**
Small inline form (not a modal). Fields:
- Which field is incorrect? (dropdown of scorecard attributes)
- What should it say?
- Source / evidence (URL, optional)
Submit without account. Reviewed by maintainers.

**L. Related Tools**
3–4 tools in the same category or sharing significant tag overlap.
Label: "You might also evaluate" — not "You might also like."

---

### 2.4 Compare Page

**Purpose:** Side-by-side decision support. Primarily for developers and indie hackers.

**Layout:** Fixed header row (tool names) + scrollable attribute rows

**Behavior:**
- Tools are added from Browse page via checkbox, or directly from tool detail pages
- Tools can be removed from the compare view without leaving the page
- Tools can be swapped by clicking a name and searching for another
- Maximum 4 columns

**Rows displayed:**
All fields from the Technical Scorecard, Hardware Requirements, and key metadata (license, stars, last commit, setup difficulty).

**Visual treatment of rows:**
- Boolean fields: clear ✓ / ✗ — no ambiguity
- Enum fields: text label
- Numeric fields: shown as numbers, optionally with a simple bar for RAM comparison
- Rows where all values are identical: option to hide them ("Show differences only" toggle)

**Export:**
- "Copy as Markdown table" button
- "Download as CSV" button
- "Share comparison" — generates a URL with tool IDs encoded in query params, no server-side storage required

---

### 2.5 Use Cases Page

**Purpose:** Persona-first entry for non-developers who don't know what categories mean.

**Layout:** Tab or card strip for each persona, each opening a curated view.

Each persona section contains:
- One-paragraph explanation of the problem this directory helps them solve
- 3–5 recommended tool categories for their context
- 3 featured tools with plain-English descriptions
- Link to filtered Browse view

**Persona sections:**
1. Business Owner
2. Developer / Engineer
3. Healthcare Professional
4. Legal Professional
5. Indie Hacker / Solo Builder

Note: These are soft entry points, not hard segmentation. A user can still access all tools regardless of which persona they identify with.

---

### 2.6 Collections (Saved Tools)

**Purpose:** Allow users to save and return to shortlists without requiring an account.

**Default behavior:** Stored in browser localStorage. No login, no email required.
**Optional sync:** Provide email → receive a recovery link to restore collection on another device or browser.

**Collection view:**
- List of saved tools (same card format as Browse)
- Can be named by the user (e.g. "For my IT contractor")
- Can be exported as a shareable URL or PDF
- Can be annotated per tool: user can add a private note of up to 200 characters

**Privacy note (visible in the UI):**
*"Your collection is saved in your browser only. It is not stored on our servers unless you choose to sync it via email."*

---

### 2.7 Submit a Tool Page

**Purpose:** Allow community contributions.

**Form fields match the content model** (Section 1.2). Required fields enforced.

**Process:**
1. User fills form
2. Submission goes to a review queue
3. Reviewer verifies accuracy of key fields (license, telemetry, offline status)
4. Tool is published or returned to submitter with notes
5. Submitter receives email notification (email required for submission, used only for this purpose)

**Anti-spam:** Honeypot field + rate limiting. No CAPTCHA on first attempt.

---

### 2.8 Community Guides Submission

Lightweight form:
- Tool it relates to (search/select)
- Guide title
- Guide URL
- Format: Article / Video / GitHub repo / Forum post
- Brief description (≤ 150 chars)
- Your name or handle (optional)

Reviewed before publishing. External links are not tracked or redirected — direct links only.

---

## 3. GLOBAL UX PATTERNS

---

### 3.1 Search

**Scope:** Full-text across name, tagline, tags, technical description.
**Behavior:** Results update as user types (debounced, 300ms delay).
**Filters remain active** during search — search narrows within current filter state.
**No autocomplete dropdown** initially (adds complexity; add in v2 if search volume warrants).
**Search state is URL-encoded** for shareability.

---

### 3.2 Navigation

**Desktop:**
- Top navbar: persistent, not sticky (page scrolls behind it)
- Breadcrumbs: on Tool Detail and Category pages

**Mobile:**
- Hamburger menu for nav links
- Filter panel becomes a full-screen sheet triggered by a "Filter" button
- Bottom bar for Compare and Save actions (replaces hover states)
- Search bar always visible in the top bar

---

### 3.3 Loading States

- Tool cards: skeleton loaders (not spinners) while list loads
- Filter application: instant if client-side filtered; skeleton if server-side
- GitHub data (stars, last commit): shown as "—" if not yet fetched, updated asynchronously. Never block page render on external data.

---

### 3.4 Error States

- Search no results: explain what was searched, which filters are active, suggest removing one filter
- Tool not found (404): suggest searching for tool name, link to Browse
- GitHub data unavailable: show "Data temporarily unavailable" inline in scorecard row — not an error page
- Form submission error: inline field-level messages, not a toast notification

---

### 3.5 Accessibility

- All interactive elements keyboard-navigable (Tab, Enter, Space, Escape for modals/sheets)
- Filter panel: checkboxes are true `<input type="checkbox">` elements with associated `<label>`
- Tool cards: entire card is not a single link — individual interactive elements within are separately focusable
- Color is never the sole indicator of state (e.g. "Active" filter chip has both color and a text label)
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text
- All badge icons have aria-label or adjacent visible text

---

### 3.6 Performance

- No client-side ML or AI on the site itself (ironic but also a trust signal)
- GitHub star counts fetched server-side and cached with 24-hour TTL — not live on each page load
- Images: tool logos only (small, WebP, lazy-loaded)
- No ad scripts, no tracking pixels, no third-party analytics by default (use privacy-respecting analytics like Plausible or Fathom only)

---

### 3.7 Trust Signals

These are distributed across the site, not concentrated on an "About" page:

- Last verified date on every tool detail page
- Clear distinction between "submitter-reported" and "maintainer-verified" data
- Explicit privacy policy for the directory itself (what data it collects, from whom)
- Open source directory codebase (links to its own GitHub) — optional but high trust value
- No sponsored listings. If any monetization exists (e.g. "Featured" slots for open-source projects), it must be clearly labeled.
- No affiliate links to model downloads or cloud hosting

---

## 4. CONTENT GUIDELINES

---

### 4.1 Plain English requirements

Every tool must have a plain-English description that:
- Uses no acronyms without explanation on first use
- Does not assume the reader knows what "quantization," "inference," or "embeddings" mean
- Answers: what does it do, what does it run on, does it need internet

### 4.2 Technical descriptions

May use standard developer terminology.
Must include: architecture type, API style, model format compatibility.

### 4.3 Prohibited content

- Marketing language ("revolutionary," "state-of-the-art," "best-in-class")
- Unverifiable claims ("completely private," "100% secure" — instead use factual statements about what data leaves the machine)
- Outdated information not marked as unverified

---

## 5. KEY UX DECISIONS AND RATIONALE

| Decision | Rationale |
|---|---|
| No login required for core browsing and saving | Privacy-sensitive audience will abandon if forced to register. localStorage-first for collections removes the barrier. |
| Plain English + Technical toggle on tool pages | Sandra (business owner) and Dr. Alain need plain language. Priya and Marcus need technical depth. One page serves both without cluttering either. |
| Filter state in URL | Allows Priya to share a pre-filtered link with a colleague. Allows Marcus to bookmark a filtered view. |
| No comment system — structured community notes instead | Prevents noise and moderation burden. Structured notes (bug/tip/use case) are more useful than freeform comments. |
| Shareable comparison URLs (no server storage) | Priya can send her comparison to her CTO without the site needing user accounts or server-side session storage. |
| "Suggest a correction" on every tool page | Data accuracy is a core value. Makes it easy for Priya to flag a missing field. Builds trust with Sandra who needs accurate info before recommending to her IT contractor. |
| No affiliate links | Audience is privacy-focused and will check. Any monetization signal that suggests bias destroys credibility immediately. |
| Telemetry field required in content model | The audience's core fear is data leaving their system. Telemetry status is a first-class field, not buried in a README. |
| Last verified date visible | Shows the directory is maintained. Stale data is dangerous — the audience may make security decisions based on it. |

---

*End of document. All scenarios and specifications are derived from first-principles reasoning about the four stated personas and their documented needs. No tool names, star counts, or community data have been fabricated.*
