# UI Specification — Data Ownership Flows (Create, Update, Delete)

> **Based on:** UX Specification v1.0 + Existing Component Analysis  
> **Design system context:** Astro 6 + Vue 3 + Tailwind CSS (custom config with `primary: #ff4d00`)  
> **Pattern language:** Bold typography (`font-black`, `tracking-wider`, `uppercase`), heavy borders (`border-2 border-gray-900`), monochrome + primary orange accent, utilitarian aesthetic with high contrast

---

## Table of Contents

1. [Cross-Cutting Principles](#1-cross-cutting-principles)
2. [Flow A: Edit Tool](#2-flow-a-edit-tool)
3. [Flow B: Delete Tool](#3-flow-b-delete-tool)
4. [Flow C: Admin Dashboard Enhancement](#4-flow-c-admin-dashboard-enhancement)
5. [Flow D: Suggest a Correction](#5-flow-d-suggest-a-correction)
6. [Flow E: Verified vs Unverified Indicators](#6-flow-e-verified-vs-unverified-indicators)
7. [Implementation Order & Dependencies](#7-implementation-order--dependencies)

---

## 1. Cross-Cutting Principles

### 1.1 Pattern Consistency

Every new component or modification **must** follow these established patterns from the existing codebase:

| Pattern | Existing Reference | Rule |
|---|---|---|
| Form label | `SubmitForm.vue` L30: `font-black text-gray-900 uppercase tracking-wider text-sm` | All labels use this exact class set |
| Text input | `SubmitForm.vue` L31: `w-full bg-white border border-gray-200 px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors` | All text inputs use this exact class set |
| Select dropdown | `SubmitForm.vue` L46: same as input + `appearance-none cursor-pointer` | Additional `bg-no-repeat` for custom arrow |
| Submit button | `SubmitForm.vue` L124: `inline-flex items-center justify-center px-8 py-4 font-black uppercase tracking-wider text-sm transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-primary-500` | Primary action buttons follow this |
| Secondary button | `SubmitForm.vue` L20: `px-6 py-3 font-black uppercase tracking-wider text-sm bg-white border border-gray-200 text-gray-900 hover:bg-gray-900 hover:text-white` | Secondary actions follow this |
| Danger button | New pattern: same as secondary but `text-red-600 border-red-200 hover:bg-red-600 hover:text-white` | Delete/reject actions |
| Error message | `SubmitForm.vue` L119: `bg-red-50 text-red-600 border border-red-600 p-4 font-bold text-sm` | Inline errors |
| Success message | `SubmitForm.vue` L3: `bg-green-50 border border-green-600 p-6` | Success banners |
| Card container | `Card.vue` L2: `bg-white border border-gray-200 p-4.5 transition-all duration-150 hover:border-gray-400 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]` | Cards use this pattern |
| Modal/overlay | New pattern — see Confirmation Dialog below | Based on existing border/shadow tokens |
| Data panel | `AdminPanel.vue` L39: `bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_rgba(17,24,39,1)]` | Admin panels use heavy shadow |
| Toggle/chip | `ActiveFiltersBar.vue` L104: `inline-flex items-center bg-white border border-gray-200 pl-2.5 pr-1 py-1 text-xs gap-1.5` | Filter/tag chips |
| Icon sizing | Throughout: Lucide icons at `:size="18"` or `:size="20"` with `stroke-width="2"` | Use Lucide Vue Next consistently |

### 1.2 State Pattern Taxonomy

Every interactive component must handle these states:

| State | Visual Treatment | Notes |
|---|---|---|
| **Default** | Normal styling per component | |
| **Loading** | `opacity-50 pointer-events-none` on buttons + skeleton shapes for content | Never use spinners for data loads; use skeleton loaders (see UX spec §3.3) |
| **Empty** | `EmptyState.vue` component with `icon`, `message`, `actionText` props | Not a blank page |
| **Error** | Field-level: inline `text-red-600 font-bold text-sm` below field. Form-level: `bg-red-50 border border-red-600 p-4 font-bold text-sm` at top of form | Per UX spec §3.4: no toast notifications for form errors |
| **Success** | Green banner (existing pattern from `SubmitForm.vue` L3) or ephemeral button text change ("Saved" → reverts after 2.2s) | Use `setTemporaryText` pattern from `[slug].astro` L706 |
| **Disabled** | `disabled:opacity-50 disabled:cursor-not-allowed` on buttons + `pointer-events-none` on forms during submission | |
| **Optimistic** | Apply UI change immediately, revert on server error | For bookmark/compare/save actions |

### 1.3 Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| **Mobile (<768px)** | Full-width forms, stacked layouts, bottom sheets for modals, hamburger nav |
| **Tablet (768-1024px)** | Two-column forms, slide-over panels |
| **Desktop (>1024px)** | Sidebar layouts, inline edit, sticky nav |

### 1.4 Keyboard & Accessibility

- All form inputs: keyboard-navigable with `Tab`, `Enter` to submit
- Modals: trap focus, `Escape` to close, `aria-modal="true"`, `role="dialog"`
- Confirmation dialogs: focus on "Cancel" button by default (safety-first)
- All interactive elements: `aria-label` or visible label
- Color is never the sole indicator (e.g., verified badge has both icon + text)
- Contrast: minimum 4.5:1 for body text, 3:1 for large text per UX spec §3.5

---

## 2. Flow A: Edit Tool

### 2.1 Overview

**Who can edit:** Admin users (authenticated via admin session) + tool submitters (verified via email token — future scope, not in v1)

**Entry points:**
- Admin Dashboard → tool list → "Edit" button per tool
- Tool Detail page → admin sees "Edit this tool" button (hidden from public)

**UX spec alignment:** UX spec §2.7 (Submit process) implies edit modifies the same data model. UX spec §3.7 (Trust signals) requires tracking verification status.

### 2.2 Component: `EditToolPanel.vue` (NEW)

**Extends:** `SubmitForm.vue` — the edit form shares 90% of the submission form layout. Rather than duplicating, refactor `SubmitForm.vue` into a base component with an "edit mode" toggle.

#### 2.2.1 Refactoring Approach

Create a shared `ToolForm.vue` that handles both create and edit:

```
SubmitForm.vue  →  refactored into  ToolForm.vue (shared)
                   SubmitForm.vue  →  wrapper that calls ToolForm.vue in create mode
                   EditToolPanel.vue →  wrapper that calls ToolForm.vue in edit mode
```

**`ToolForm.vue` props:**

```typescript
interface ToolFormProps {
  mode: 'create' | 'edit';
  initialData?: Tool;          // pre-populated fields for edit mode
  toolSlug?: string;           // required in edit mode
  onSubmit: (data: FormData) => Promise<void>;
  onCancel?: () => void;       // only in edit mode
}
```

**Visual differences between create and edit mode:**

| Element | Create Mode | Edit Mode |
|---|---|---|
| Title | "Submit a Tool" | "Edit Tool — {name}" |
| Submit button | "Submit Tool" | "Save Changes" |
| Cancel button | Hidden | Visible (secondary button) |
| GitHub autofill | Visible | Hidden (data already populated) |
| Field values | Empty | Pre-populated from `initialData` |
| Verification badge | Not shown | Shown per field (see Flow E) |

#### 2.2.2 Edit Form Layout

```
┌─────────────────────────────────────────────────────────┐
│  Edit Tool — Ollama                              [✕]   │  ← H1 + close/cancel
│  Last verified: 2026-05-12 · Created: 2026-01-08       │  ← Metadata line
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ REQUIRED FIELDS ─────────────────────────────────┐  │
│  │                                                    │  │
│  │  NAME *                            ⚠ Unverified   │  │  ← Field + verification badge
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ Ollama                                       │  │  │  ← Pre-populated input
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  TAGLINE *                                       ✓  │  │  ← Verified field (green check)
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ Run local LLMs with a single command         │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  ... (all fields from content model)               │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ HARDWARE ────────────────────────────────────────┐  │
│  │  ☑ CPU Only                                       │  │
│  │  ☑ NVIDIA GPU (CUDA)                              │  │
│  │  ☐ AMD GPU (ROCm)                                 │  │
│  │  ☑ Apple Silicon (Metal)                          │  │
│  │  ☐ Low-resource (< 8GB RAM)                       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  ...                                                    │
│                                                         │
│  ┌────────────────────────────────────────────────┐     │
│  │  [Cancel]                    [Save Changes]     │     │  ← Footer actions
│  └────────────────────────────────────────────────┘     │
│                                                         │
│  ┌────────────────────────────────────────────────┐     │
│  │  ⚠ You are editing a public tool listing.      │     │
│  │  Changes will be visible immediately after     │     │
│  │  the next build.                               │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

#### 2.2.3 Interaction Sequence

1. Admin navigates to admin dashboard or tool detail page
2. Clicks "Edit" button on a tool entry
3. System loads current tool data from API (`GET /api/admin/tools/{slug}`)
4. `EditToolPanel.vue` renders with `initialData` pre-populated
5. Loading state: skeleton form with 6 placeholder rows (same dimensions as real inputs)
6. Admin modifies one or more fields
7. Each field shows a "modified" indicator when its value diverges from `initialData`: a small orange dot + "Modified" label to the right of the field
8. Admin clicks "Save Changes"
9. Client-side validation runs (same rules as SubmitForm)
10. On validation error: inline field errors, form stays open
11. On submit: button shows "Saving..." with disabled state, form data sent as `FormData` via `POST /api/admin/tools/{slug}/update`
12. On success: green banner "Tool updated successfully. Rebuild pages to publish changes." + "View tool" link
13. On server error: red banner with error message, form stays editable

#### 2.2.4 Key UI Differences from SubmitForm

| Feature | SubmitForm | EditToolPanel |
|---|---|---|
| Revision history | Not applicable | "View revision history" link at bottom |
| Last verified date | Not shown | Shown in header metadata |
| Diff tracking | No | Orange dot on changed fields |
| Cancel action | No | Yes — prompts "Discard changes?" if dirty |
| Publish trigger | Auto (goes to queue) | Requires explicit rebuild (see AdminPanel pattern `[slug].astro` L153) |
| Field verification | All unverified | Each field shows verified/unverified status |

#### 2.2.5 Mobile Adaptations

- On mobile, the edit form is full-width with stacked fields
- The verification badges appear inline (not in a separate column)
- Cancel/Save buttons are full-width, stacked vertically (Cancel above Save)
- No sticky sidebar for revision history — it becomes a collapsible section at the bottom

#### 2.2.6 Dirty State Detection

Track `isDirty` via a computed that deep-compares current form values against `initialData`:

```typescript
const isDirty = computed(() => {
  return JSON.stringify(currentForm.value) !== JSON.stringify(props.initialData);
});
```

- If `isDirty` is true and user clicks "Cancel" or navigates away: show confirmation dialog
- If `isDirty` is false: close without prompt

#### 2.2.7 Revision History (Future Scope)

Stub UI for v1: a link at the bottom of the edit form:

```
┌─────────────────────────────────────────────────────────┐
│  Revision history — Last 5 changes                      │
│                                                         │
│  May 12, 2026  → License updated (admin)                │
│  Apr 28, 2026  → Hardware requirements updated (admin)  │
│  Apr 15, 2026  → Tool added to directory (submitter)    │
│                                                         │
│  [View full history →]                                  │
└─────────────────────────────────────────────────────────┘
```

Each entry shows: date, field changed, who made the change.

---

## 3. Flow B: Delete Tool

### 3.1 Overview

**Who can delete:** Admin users only (in v1)

**What happens on delete:**
- Tool is soft-deleted (not removed from database) — sets `deleted_at` timestamp
- Tool is removed from all public views (Browse, Search, Compare, Detail pages)
- Tool is removed from user's localStorage collections on next load (client-side reconciliation)
- Tool is removed from comparison trays on next load
- Tool is removed from Stack Builder on next load
- Community notes and guides associated with the tool are preserved but marked "Tool unavailable"
- Admin can view deleted tools in a "Recycle Bin" section for 30 days

**UX spec alignment:** UX spec §3.7 requires "Last verified date" and data accuracy. Deleted tools must not appear stale.

### 3.2 Component: `ConfirmDialog.vue` (NEW)

**Reusable confirmation dialog** — used for delete, but generic enough for any destructive action.

```typescript
interface ConfirmDialogProps {
  open: boolean;
  title: string;                    // "Delete Ollama?"
  description: string;              // "This will remove the tool from the directory..."
  confirmLabel: string;             // "Delete tool"
  cancelLabel?: string;             // "Keep tool" (default)
  variant?: 'danger' | 'warning';   // 'danger' by default
  destructive?: boolean;            // requires typing tool name to confirm
  itemName?: string;                // tool name for type-to-confirm
  loading?: boolean;
}
```

#### 3.2.1 Visual Design — Delete Confirmation

```
┌──────────────────────────────────────────────────────┐
│  ⚠                                                  │  ← Warning icon (Lucide `AlertTriangle`)
│                                                      │
│  Delete Ollama?                                      │  ← Title
│                                                      │
│  This will permanently remove Ollama from the        │
│  directory. It will no longer appear in:             │
│  • Browse and search results                         │
│  • Comparison tables                                 │
│  • User collections and stacks                       │
│  • Tool detail pages                                 │
│                                                      │
│  Community notes and guides will be preserved        │
│  but marked "Tool unavailable."                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ Type "ollama" to confirm                     │    │  ← Type-to-confirm input
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│           [Keep tool]    [Delete tool]               │  ← Danger button disabled until typed
│                                                      │
│  ⚠ This action cannot be undone.                     │
└──────────────────────────────────────────────────────┘
```

**Layout rules:**
- Maximum width: `max-w-[520px]`
- Centered vertically and horizontally using fixed overlay
- Overlay background: `bg-black/50 backdrop-blur-sm`
- Dialog background: `bg-white`
- Border: `border-2 border-gray-900`
- Shadow: `shadow-[8px_8px_0_0_rgba(17,24,39,1)]` (heavy admin-style shadow)
- Danger button: `bg-red-600 text-white hover:bg-red-700 font-black uppercase tracking-wider px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed`
- Cancel button: standard secondary button pattern

#### 3.2.2 Type-to-Confirm Pattern

For destructive actions (delete), require the user to type the tool's exact name:

```typescript
const confirmed = ref(false);
const typedName = ref('');

watch(typedName, (val) => {
  confirmed.value = val.trim().toLowerCase() === props.itemName?.toLowerCase();
});
```

- Input placeholder: `Type "{toolName}" to confirm`
- Delete button disabled until `confirmed === true`
- On mobile: same pattern, full-width dialog

### 3.3 Component: `ToolDeleteHandler.vue` (NEW)

**Orchestrates the deletion flow.** Not a visible component itself — it manages the lifecycle:

1. Admin clicks "Delete" → `ConfirmDialog` opens
2. Admin types tool name + clicks "Delete tool"
3. Loading state: button shows "Deleting..." with spinner
4. API call: `POST /api/admin/tools/{slug}/delete` (soft delete)
5. Success: tool removed from current view + toast "Ollama has been deleted" + "Undo?" link (undo available for 30 seconds via `POST /api/admin/tools/{slug}/restore`)
6. Error: error message in dialog, dialog stays open
7. Cascade to client-side:
   - `localStorage.removeItem('enclavetools-compare')` if the tool was in the compare tray — dispatch `compare:changed` event
   - Remove from bookmarks: dispatch `bookmarks:changed` event so `FavoritesView.vue` reconciles
   - Remove from stack: dispatch custom event `stack:changed`
   - These events trigger the existing listeners to refresh from localStorage

### 3.4 Cascade Effects — Detailed Specification

#### 3.4.1 Server-Side Cascade

When a tool is deleted (soft or hard):

| Affected Data | Action |
|---|---|
| Tool record | Set `deleted_at = NOW()`, `status = 'deleted'` |
| Community notes | Keep in database, set `tool_available = false` on display |
| Community guides | Keep in database, set `tool_available = false` on display |
| Correction suggestions | Keep in database, set `tool_slug = NULL` (orphaned) |
| User collections | NOT deleted server-side (collections are localStorage-only) |

#### 3.4.2 Client-Side Reconciliation

On page load after a deletion, components should reconcile their localStorage state:

```typescript
// In App.vue or a composable:
onMounted(async () => {
  // Fetch list of valid slugs from API
  const { validSlugs } = await fetch('/api/tools/valid-slugs').then(r => r.json());
  
  // Prune compare tray
  const compare = JSON.parse(localStorage.getItem('enclavetools-compare') || '[]');
  localStorage.setItem('enclavetools-compare', JSON.stringify(
    compare.filter((slug: string) => validSlugs.includes(slug))
  ));
  
  // Prune bookmark
  const bookmarks = JSON.parse(localStorage.getItem('rom_bookmarks') || '[]');
  localStorage.setItem('rom_bookmarks', JSON.stringify(
    bookmarks.filter((t: BookmarkedTool) => validSlugs.includes(t.slug))
  ));
  
  // Prune stack
  const stack = JSON.parse(localStorage.getItem('enclavetools-stack') || '[]');
  localStorage.setItem('enclavetools-stack', JSON.stringify(
    stack.filter((slug: string) => validSlugs.includes(slug))
  ));
});
```

### 3.5 Undo Flow

After deletion, show a toast-style banner at the top of the admin panel:

```
┌──────────────────────────────────────────────────────┐
│  ✓ Ollama has been deleted.            [Undo]  [✕]  │  ← Ephemeral banner (30s)
│  It will be permanently removed in 30 days.          │
└──────────────────────────────────────────────────────┘
```

- Styling: `bg-green-50 border border-green-600 p-4 font-bold text-sm flex items-center gap-4`
- Undo button: standard secondary button, calls `POST /api/admin/tools/{slug}/restore`
- Auto-dismisses after 30 seconds
- If "Undo" clicked: tool restores, banner updates to "Ollama has been restored"

### 3.6 Deleted Tool UI on Detail Page

If a user navigates directly to a deleted tool's URL (bookmark):

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  This tool is no longer listed in the directory.     │
│                                                      │
│  It may have been removed by a maintainer or         │
│  the submission may not have met listing criteria.   │
│                                                      │
│  [Browse all tools]  [Search for similar tools]      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Use `EmptyState.vue` with icon="search" and custom message
- Do NOT show 404 — it was a valid tool, just removed
- This page IS still indexed for 30 days (redirect to this notice), then 301 to Browse

---

## 4. Flow C: Admin Dashboard Enhancement

### 4.1 Overview

The existing `AdminPanel.vue` handles only pending submissions (approve/reject). The enhanced dashboard adds:

1. **Tool Management** — list of all published tools with edit/delete actions
2. **Correction Queue** — pending corrections from users
3. **Revision History** — view changes per tool
4. **Recycle Bin** — view soft-deleted tools with restore option

### 4.2 Component: `AdminDashboard.vue` (NEW)

**Replaces the existing `AdminPanel.vue`** — or the existing component is wrapped to add tabs.

#### 4.2.1 Tab Structure

```
┌─────────────────────────────────────────────────────────┐
│  [Pending (3)] [Published (142)] [Corrections (2)]      │  ← Tab navigation
│  [Recycle Bin (1)]                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  (Tab content area)                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Tab styling:**
- Active tab: `bg-gray-900 text-white font-black uppercase tracking-wider text-xs px-4 py-2`
- Inactive tab: `bg-white text-gray-600 font-bold uppercase tracking-wider text-xs px-4 py-2 border border-gray-200 hover:border-gray-900`
- Tab container: `flex gap-2 border-b-2 border-gray-900 pb-4 mb-6`

#### 4.2.2 Published Tools Tab

```
┌──────────────────────────────────────────────────────────┐
│  Published Tools (142)              [Search...] [Sort ▼] │  ← Search + sort
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Ollama              v1.2.3   MIT  ★ 45k  [Edit][⋮]│  │  ← Tool row
│  │ Llama.cpp           v3.1     MIT  ★ 62k  [Edit][⋮]│  │
│  │ LM Studio           v0.2.29  BSL  ★ 15k  [Edit][⋮]│  │
│  │ ...                                                 │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [Prev]  1  2  3 ... 15  [Next]                          │  ← Pagination
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Tool row layout:**
- Classes: `grid grid-cols-[1fr_auto] items-center p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50`
- Contains: name link → category badge → license chip → star count → action buttons
- Action buttons: "Edit" (primary), "⋮" (more menu) containing "Delete", "View detail", "View revision history"
- More menu: dropdown with `absolute right-0 top-full bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_rgba(17,24,39,1)] z-50`
- More menu items: `px-4 py-2 hover:bg-gray-100 font-bold text-sm cursor-pointer` (danger items: `text-red-600`)

#### 4.2.3 Correction Queue Tab

Displays pending "Suggest a Correction" submissions (see Flow D):

```
┌──────────────────────────────────────────────────────────┐
│  Pending Corrections (2)                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Ollama — License field                            │  │
│  │  "Current: MIT. Should be: Apache 2.0"             │  │
│  │  Source: github.com/ollama/ollama/LICENSE          │  │
│  │  Submitted by: anonymous · 2 days ago               │  │
│  │  [View tool]  [Apply] [Dismiss] [Edit tool →]      │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  Llama.cpp — Telemetry field                       │  │
│  │  "Current: None. Should be: Optional"              │  │
│  │  Source: github.com/ggerganov/llama.cpp#1234       │  │
│  │  Submitted by: user@... · 5 days ago                │  │
│  │  [View tool]  [Apply] [Dismiss] [Edit tool →]      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- "Apply" button: auto-updates the field and marks the correction as resolved
- "Dismiss" button: closes the correction with optional reason
- "Edit tool →" navigates to the edit form for that tool, pre-populated with the suggested change highlighted
- Each card: `border border-gray-200 p-5 bg-white`
- "Apply" button: `bg-green-600 text-white font-bold px-4 py-2 text-xs`
- "Dismiss" button: `bg-white border border-gray-200 text-gray-600 font-bold px-4 py-2 text-xs`

#### 4.2.4 Recycle Bin Tab

```
┌──────────────────────────────────────────────────────────┐
│  Recycle Bin (1) — Tools deleted in the last 30 days     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ◉ Tool Name      Deleted 12 May 2026  [Restore]  │  │
│  │    by admin@...   Expires 11 Jun 2026              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Deleted tools are permanently removed after 30 days.    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Restore button: calls `POST /api/admin/tools/{slug}/restore`
- Shows deletion date, who deleted it, permanent deletion date

#### 4.2.5 Existing Pending Tab (Unchanged)

The current approve/reject flow from `AdminPanel.vue` stays as-is, just re-homed as the first tab.

### 4.3 Modifications to `AdminPanel.vue`

**Minimal changes approach:**
1. Add tab navigation state at the top of the template
2. Extract existing approve/reject content into a `PendingSubmissions` section within a tab
3. Add new tab sections for Published, Corrections, Recycle Bin
4. Keep the "Rebuild Pages" and "Logout" buttons in the header, visible on all tabs

**New API endpoints required:**
- `GET /api/admin/tools` — list all tools (paginated, searchable)
- `GET /api/admin/tools/{slug}` — get single tool for editing
- `POST /api/admin/tools/{slug}/update` — update tool fields
- `POST /api/admin/tools/{slug}/delete` — soft delete
- `POST /api/admin/tools/{slug}/restore` — restore soft-deleted tool
- `GET /api/admin/tools/deleted` — list deleted tools
- `GET /api/admin/corrections` — list pending corrections
- `POST /api/admin/corrections/{id}/apply` — apply a correction
- `POST /api/admin/corrections/{id}/dismiss` — dismiss a correction

### 4.4 Component: `AdminToolRow.vue` (NEW)

A reusable row component for the Published Tools list:

```typescript
interface AdminToolRowProps {
  tool: ToolWithCategory;
  onEdit: (slug: string) => void;
  onDelete: (slug: string) => void;
  onViewHistory: (slug: string) => void;
}
```

Template pattern (matches existing card style):

```html
<div class="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-4 p-5 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
  <div class="flex flex-col gap-2 min-w-0">
    <div class="flex items-center gap-3 flex-wrap">
      <a :href="`/tools/${tool.slug}`" class="text-lg font-black text-gray-900 hover:text-primary-500 no-underline truncate">
        {{ tool.title }}
      </a>
      <span class="text-xs font-bold bg-gray-100 border border-gray-300 px-2 py-0.5 uppercase tracking-wider">
        {{ categoryValue(tool) }}
      </span>
      <span class="text-xs font-bold text-gray-500">
        {{ tool.license }}
      </span>
    </div>
    <div class="flex items-center gap-4 text-xs font-semibold text-gray-500">
      <span>★ {{ tool.popularity_score?.toLocaleString() || 0 }}</span>
      <span>{{ tool.setup_difficulty }} setup</span>
      <span>Verified: {{ formatDate(tool.last_verified) }}</span>
    </div>
  </div>
  <div class="flex items-center gap-2">
    <button @click="onEdit(tool.slug)" class="px-4 py-2 bg-gray-900 text-white font-black uppercase tracking-wider text-xs hover:bg-primary-500 transition-colors cursor-pointer border-none">
      Edit
    </button>
    <div class="relative" ref="menuContainer">
      <button @click="toggleMenu" class="px-2 py-2 bg-white border border-gray-200 text-gray-600 hover:border-gray-900 transition-colors cursor-pointer">
        <svg ...>...</svg> <!-- Lucide MoreVertical -->
      </button>
      <div v-if="menuOpen" class="absolute right-0 top-full mt-1 bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_rgba(17,24,39,1)] z-50 min-w-[160px]">
        <button @click="handleDelete" class="block w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 border-none cursor-pointer">Delete</button>
        <button @click="handleHistory" class="block w-full text-left px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 border-none cursor-pointer">Revision history</button>
      </div>
    </div>
  </div>
</div>
```

### 4.5 Component: `CorrectionCard.vue` (NEW)

For the correction queue tab — each pending correction is displayed as a card:

```typescript
interface CorrectionCardProps {
  id: number;
  toolSlug: string;
  toolName: string;
  field: string;
  currentValue: string;
  suggestedValue: string;
  sourceUrl?: string;
  submitterEmail?: string;
  submittedAt: string;
  onApply: (id: number) => void;
  onDismiss: (id: number) => void;
  onEditTool: (slug: string) => void;
}
```

---

## 5. Flow D: Suggest a Correction

### 5.1 Overview

**UX spec reference:** §2.3.K — "Suggest a Correction" inline form on every tool detail page

**Purpose:** Allow any visitor (no account required) to flag inaccurate data in a tool listing. This is a trust-building feature, not a moderation burden.

### 5.2 Component: `SuggestCorrection.vue` (NEW)

**Not a modal** — per UX spec §2.3.K: "Small inline form (not a modal)."

#### 5.2.1 Visual Design

The existing correction form in `[slug].astro` (L609-638) is a static HTML form with no JavaScript interactivity. This Vue component replaces it with a state-managed version.

```
/* COLLAPSED STATE — default */
┌──────────────────────────────────────────────────────────┐
│  ⚠ See something inaccurate?  [Suggest a correction →]   │  ← Subtle callout
└──────────────────────────────────────────────────────────┘

/* EXPANDED STATE — after clicking */
┌──────────────────────────────────────────────────────────┐
│  Suggest a correction for Ollama                         │
│                                                          │
│  Which field? *                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ License                                    ▼       │  │  ← Dropdown
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  What should it say? *                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │ This tool is licensed under Apache 2.0, not MIT.  │  │  ← Textarea
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Source / evidence (optional)                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ https://github.com/owner/repo/blob/main/LICENSE   │  │  ← URL input
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Your email (optional — for follow-up)                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ you@example.com                                   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [Cancel]                    [Submit for review]         │
│                                                          │
│  Submissions are reviewed by maintainers.                 │
│  Your email will only be used to follow up on this       │
│  correction.                                             │
└──────────────────────────────────────────────────────────┘

/* SUCCESS STATE */
┌──────────────────────────────────────────────────────────┐
│  ✓ Correction submitted                                 │
│                                                          │
│  Thank you! A maintainer will review your suggestion.    │
│  If you provided an email, you'll be notified when       │
│  the correction is reviewed.                             │
│                                                          │
│  [Submit another]                                        │
└──────────────────────────────────────────────────────────┘

/* ERROR STATE */
┌──────────────────────────────────────────────────────────┐
│  ✗ Failed to submit correction                           │
│  Network error. Please try again.                        │
│                                                          │
│  [Try again]  [Cancel]                                   │
└──────────────────────────────────────────────────────────┘
```

#### 5.2.2 Props & Events

```typescript
interface SuggestCorrectionProps {
  toolSlug: string;
  toolName: string;
  fields: CorrectionField[];    // Available fields from scorecard
}

interface CorrectionField {
  value: string;                // API field name
  label: string;                // Display label ("License", "Telemetry", etc.)
  currentValue: string;         // Current value shown
}
```

#### 5.2.3 Integration with Tool Detail Page

Replace the static HTML form in `[slug].astro` (L609-638) with:

```astro
<SuggestCorrection
  client:load
  toolSlug={slug}
  toolName={enrichedTool.title}
  fields={[
    { value: 'license', label: 'License', currentValue: enrichedTool.license },
    { value: 'telemetry', label: 'Telemetry', currentValue: enrichedTool.telemetry },
    { value: 'hardware', label: 'Hardware', currentValue: enrichedTool.hardware?.join(', ') },
    { value: 'setup_difficulty', label: 'Setup difficulty', currentValue: enrichedTool.setup_difficulty },
    { value: 'commercial_use', label: 'Commercial use', currentValue: enrichedTool.commercial_use ? 'Yes' : 'No' },
    { value: 'offline_after_setup', label: 'Offline after setup', currentValue: enrichedTool.offline_after_setup ? 'Yes' : 'No' },
    { value: 'openai_api', label: 'OpenAI-compatible API', currentValue: enrichedTool.openai_api ? 'Yes' : 'No' },
    { value: 'rest_api', label: 'REST API', currentValue: enrichedTool.rest_api ? 'Yes' : 'No' },
    { value: 'docker_available', label: 'Docker available', currentValue: enrichedTool.docker_available ? 'Yes' : 'No' },
    { value: 'gui_available', label: 'GUI / No-code', currentValue: enrichedTool.gui_available ? 'Yes' : 'No' },
    { value: 'fine_tuning', label: 'Fine-tuning support', currentValue: enrichedTool.fine_tuning ? 'Yes' : 'No' },
    { value: 'quantization', label: 'Quantization support', currentValue: enrichedTool.quantization ? 'Yes' : 'No' },
  ]}
/>
```

#### 5.2.4 States

| State | Behavior |
|---|---|
| **Collapsed** | Shows subtle "See something inaccurate?" callout with button |
| **Expanded** | Shows full inline form — scrolls into view smoothly (`scrollIntoView({ behavior: 'smooth' })`) |
| **Loading** | Submit button shows "Submitting..." with disabled state |
| **Field validation** | Required fields (`field`, `suggestedValue`) show inline red error if empty on submit |
| **Success** | Green banner "Correction submitted" with "Submit another" button to reset |
| **Server error** | Red error banner with retry option |
| **Rate limited** | "Too many submissions. Please try again later." with cooldown indicator |

#### 5.2.5 Anti-Spam

- Honeypot field (hidden input that bots fill, humans don't) — same pattern as UX spec §2.7
- Rate limiting: max 3 submissions per IP per hour (server-side enforced)
- No CAPTCHA on first attempt

#### 5.2.6 Mobile

- Same inline layout, full-width
- Field dropdown is a native `<select>` (better mobile UX)
- Email field is `type="email"` with `inputmode="email"` for mobile keyboard

---

## 6. Flow E: Verified vs Unverified Data Indicators

### 6.1 Overview

**UX spec reference:** §1.2 (Content Model — `last_verified_date`), §3.7 (Trust signals — "Clear distinction between submitter-reported and maintainer-verified data")

### 6.2 Visual Language

Three-tier verification status:

| Status | Visual | Meaning |
|---|---|---|
| **Verified** | Green checkmark ✓ with "Verified" text | Maintainer has confirmed this field's accuracy |
| **Unverified** | Yellow/orange warning ⚠ with "Unverified" text | Submitted by community, not yet confirmed |
| **Discrepancy flagged** | Red alert ✗ with "Flagged" text | Correction has been submitted, suggesting current data is wrong |

### 6.3 Component: `VerificationBadge.vue` (NEW)

```typescript
interface VerificationBadgeProps {
  status: 'verified' | 'unverified' | 'flagged';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;      // Show text label ("Verified") or just icon
  lastVerified?: string;    // Date string for tooltip
}
```

#### 6.3.1 Visual Treatments

**Verified (size="sm"):**
```
✓ Verified
```
- Classes: `inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5`
- Tooltip: "Verified by maintainer on {date}"

**Unverified (size="sm"):**
```
⚠ Unverified
```
- Classes: `inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5`
- Tooltip: "Submitted by community. Not yet verified by a maintainer."

**Flagged (size="sm"):**
```
✗ Correction pending
```
- Classes: `inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-300 px-2 py-0.5`
- Tooltip: "A correction has been suggested for this field."

#### 6.3.2 Placement

| Location | Placement | Size | Show Label? |
|---|---|---|---|
| **Scorecard row** | `[Label] [Badge] [Value]` — badge inline after label | `sm` | Yes |
| **Edit form field** | Right of input, aligned vertically | `sm` | Yes |
| **Tool detail header** | Next to "Last verified: {date}" line | `md` | Yes |
| **Tool card** | Not shown (too dense) | — | No |
| **Admin dashboard** | Column in tool list | `sm` | No (icon only) |

#### 6.3.3 Data Model Extension

The `Tool` interface gains per-field verification tracking:

```typescript
interface FieldVerification {
  status: 'verified' | 'unverified' | 'flagged';
  verifiedBy?: string;       // Admin email
  verifiedAt?: string;       // ISO date
  flagReason?: string;       // Correction text
}

// Extended Tool interface additions:
interface Tool {
  // ... existing fields ...
  
  // Per-field verification status
  verification?: {
    license?: FieldVerification;
    telemetry?: FieldVerification;
    hardware?: FieldVerification;
    setup_difficulty?: FieldVerification;
    commercial_use?: FieldVerification;
    offline_after_setup?: FieldVerification;
    openai_api?: FieldVerification;
    rest_api?: FieldVerification;
    docker_available?: FieldVerification;
    gui_available?: FieldVerification;
    fine_tuning?: FieldVerification;
    quantization?: FieldVerification;
    plain_description?: FieldVerification;
    technical_description?: FieldVerification;
  };
}
```

### 6.4 Integration with Scorecard (Tool Detail Page)

Current scorecard (`[slug].astro` L381-400):
```html
<div class="grid grid-cols-[minmax(180px,0.8fr)_1.2fr] border-b-2 border-gray-900">
  <span class="p-3.5 text-sm text-gray-600 border-r-2 border-gray-900">License</span>
  <strong class="p-3.5 text-sm font-black">Apache 2.0</strong>
</div>
```

Enhanced with verification:
```html
<div class="grid grid-cols-[minmax(180px,0.8fr)_auto_1.2fr] border-b-2 border-gray-900">
  <span class="p-3.5 text-sm text-gray-600 border-r-2 border-gray-900 flex items-center gap-2">
    License
    <VerificationBadge status="verified" size="sm" />
  </span>
  <strong class="p-3.5 text-sm font-black">Apache 2.0</strong>
</div>
```

Grid changes from `grid-cols-[minmax(180px,0.8fr)_1.2fr]` to `grid-cols-[minmax(180px,0.8fr)_auto_1.2fr]` where the middle column is `auto`-width for the badge.

### 6.5 Integration with Edit Form

Each field in `ToolForm.vue` (edit mode) shows its verification status:

```
Name *                                     ⚠ Unverified
┌──────────────────────────────────────────┐
│ Ollama                                   │
└──────────────────────────────────────────┘

Tagline *                                  ✓ Verified by admin@... on May 12, 2026
┌──────────────────────────────────────────┐
│ Run local LLMs with a single command     │
└──────────────────────────────────────────┘
```

**Admin action in edit form:**
- For unverified fields, an admin can click the badge to toggle it to verified:
  - Clicking "⚠ Unverified" opens a small inline confirmation: "Mark this field as verified?"
  - Confirming changes badge to "✓ Verified" and sets `verifiedBy` and `verifiedAt`
- This is a per-field action that saves independently from the main form save

### 6.6 Color System for Status Indicators

To avoid relying on color alone (accessibility):

| Status | Color | Icon | Text |
|---|---|---|---|
| Verified | Green (`text-green-700 bg-green-50`) | `✓` checkmark | "Verified" |
| Unverified | Amber (`text-amber-700 bg-amber-50`) | `⚠` warning triangle | "Unverified" |
| Flagged | Red (`text-red-700 bg-red-50`) | `✗` cross | "Correction pending" |

All badges use Lucide icons with `aria-label` for screen readers.

---

## 7. Implementation Order & Dependencies

### Phase 1: Foundation (Backend API changes)

| # | Task | Depends On |
|---|---|---|
| 1.1 | Add `verification` field to tool data model | — |
| 1.2 | Add `deleted_at`, `status` fields to tool data model | — |
| 1.3 | Create `corrections` table/collection | — |
| 1.4 | Create `revisions` table/collection (for history) | — |
| 1.5 | Implement `GET /api/admin/tools` (paginated) | 1.2 |
| 1.6 | Implement `POST /api/admin/tools/{slug}/update` | 1.1 |
| 1.7 | Implement `POST /api/admin/tools/{slug}/delete` (soft) | 1.2 |
| 1.8 | Implement `POST /api/admin/tools/{slug}/restore` | 1.7 |
| 1.9 | Implement `POST /api/corrections` (public submission) | 1.3 |
| 1.10 | Implement `GET /api/admin/corrections` | 1.3 |
| 1.11 | Implement `POST /api/admin/corrections/{id}/apply` | 1.3 |
| 1.12 | Implement `POST /api/admin/corrections/{id}/dismiss` | 1.3 |
| 1.13 | Implement `GET /api/tools/valid-slugs` (for client reconciliation) | 1.7 |

### Phase 2: Shared Components

| # | Task | Depends On |
|---|---|---|
| 2.1 | Create `VerificationBadge.vue` | — |
| 2.2 | Create `ConfirmDialog.vue` | — |
| 2.3 | Refactor `SubmitForm.vue` → `ToolForm.vue` (shared create/edit) | — |
| 2.4 | Update `SubmitForm.vue` as wrapper around `ToolForm.vue` | 2.3 |

### Phase 3: Edit & Delete

| # | Task | Depends On |
|---|---|---|
| 3.1 | Create `EditToolPanel.vue` (wrapper around `ToolForm.vue`) | 2.3, 2.1 |
| 3.2 | Create `ToolDeleteHandler.vue` | 2.2 |
| 3.3 | Create `AdminToolRow.vue` | — |

### Phase 4: Admin Dashboard Overhaul

| # | Task | Depends On |
|---|---|---|
| 4.1 | Add tab navigation to `AdminPanel.vue` | — |
| 4.2 | Create Published Tools tab with `AdminToolRow.vue` | 3.3, 1.5 |
| 4.3 | Create Corrections tab with `CorrectionCard.vue` | 1.10 |
| 4.4 | Create Recycle Bin tab | 1.12 |
| 4.5 | Add edit/delete buttons to existing Pending tab | 3.1, 3.2 |

### Phase 5: Public Facing

| # | Task | Depends On |
|---|---|---|
| 5.1 | Create `SuggestCorrection.vue` | — |
| 5.2 | Replace static form in `[slug].astro` with `SuggestCorrection` | 5.1 |
| 5.3 | Add `VerificationBadge` to scorecard in `[slug].astro` | 2.1 |
| 5.4 | Add verification indicators to tool detail page header | 2.1 |
| 5.5 | Implement client-side localStorage reconciliation on page load | 1.13 |
| 5.6 | Create deleted-tool placeholder page in tool detail page | — |

### Phase 6: Polish & Audit

| # | Task | Depends On |
|---|---|---|
| 6.1 | Keyboard accessibility audit for all new components | All |
| 6.2 | WCAG contrast check for verification badges (green/amber/red on white) | 2.1 |
| 6.3 | Mobile QA for edit form, confirmation dialog, correction form | All |
| 6.4 | Loading skeleton for edit form | 3.1 |
| 6.5 | Error state validation for all API calls | All |

---

## Appendix A: File Changes Summary

| File | Action | Purpose |
|---|---|---|
| `src/components/ToolForm.vue` | **CREATE** | Shared form for create/edit |
| `src/components/EditToolPanel.vue` | **CREATE** | Edit tool wrapper |
| `src/components/ConfirmDialog.vue` | **CREATE** | Reusable confirmation dialog |
| `src/components/VerificationBadge.vue` | **CREATE** | Verified/unverified indicator |
| `src/components/SuggestCorrection.vue` | **CREATE** | Inline correction form |
| `src/components/AdminToolRow.vue` | **CREATE** | Tool row for admin list |
| `src/components/CorrectionCard.vue` | **CREATE** | Correction queue card |
| `src/components/ToolDeleteHandler.vue` | **CREATE** | Delete orchestration |
| `src/components/SubmitForm.vue` | **MODIFY** | Wrap `ToolForm.vue` in create mode |
| `src/components/AdminPanel.vue` | **MODIFY** | Add tabs, published tools list, corrections, recycle bin |
| `src/pages/tools/[slug].astro` | **MODIFY** | Replace static correction form with `SuggestCorrection`, add `VerificationBadge` to scorecard |
| `src/types/index.ts` | **MODIFY** | Add `FieldVerification`, `Correction`, `Revision` interfaces |
| `src/utils/toolModel.ts` | **MODIFY** | Add verification enrichment |
| `tailwind.config.js` | **NO CHANGE** | Existing tokens suffice |

## Appendix B: New API Contracts

### `POST /api/admin/tools/{slug}/update`

**Request:** `FormData` (same schema as submit form)  
**Response:**
```json
{
  "success": true,
  "tool": { "...updated tool..." },
  "revision_id": "rev_abc123"
}
```

### `POST /api/admin/tools/{slug}/delete`

**Request:** (empty)  
**Response:**
```json
{
  "success": true,
  "deleted_at": "2026-05-12T14:30:00Z",
  "permanently_deleted_at": "2026-06-11T14:30:00Z"
}
```

### `POST /api/corrections`

**Request:**
```json
{
  "tool_slug": "ollama",
  "field": "license",
  "current_value": "MIT",
  "suggested_value": "Apache 2.0",
  "source_url": "https://...",
  "submitter_email": "user@example.com"
}
```
**Response:**
```json
{
  "success": true,
  "correction_id": 42
}
```

---

*End of specification. All flows reference existing UI patterns from the codebase analysis conducted on 2026-06-03.*
