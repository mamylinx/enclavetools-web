# Tools Listing Page — Grid to List View Redesign

**Date**: 2026-08-07  
**Status**: Approved  
**Target**: `src/components/CardsContainer.vue` + new `ToolRow.vue`

---

## Goal

Replace the 2-column card grid on the Tools Listing Page with a compact single-line list view for improved **scanability** — users can see 2-3x more tools without scrolling.

## User Preferences

- **Motivation**: Scanability — faster vertical scanning of many tools
- **Content**: Same data as current cards, rearranged into list
- **Toggle**: Replace entirely — no grid/list switcher
- **Style**: Compact rows — single-line, minimal padding, maximum density

## Design

### Row Layout

```
[Category]  Tool Name ──────────────  ★★★★☆  License  [→]
```

### Row Elements

| Element | Style |
|---------|-------|
| Category pill | Same `brand-tealLight` badge as current card |
| Title | `font-bold text-brand-forest` |
| Stars | Same star icon + score |
| License | Inline text badge |
| CTA | `→` arrow link (replaces "Explore Tools" button) |
| Compare | CompareToggle inline at row end |

### Structural Changes

| Current | New |
|---------|-----|
| `grid grid-cols-1 md:grid-cols-2 gap-4` | `flex flex-col gap-1` |
| `<Card>` component | New `<ToolRow>` component |
| `rounded-3xl p-6 shadow-sm` card | `flex items-center gap-3 px-4 py-3 bg-white border-b border-brand-forest/10` |
| ~8-10 tools visible | ~20-25 tools visible |

### What Stays Unchanged

- SortBar, PaginationNav, PromotedAd, SponsorCard, NewsletterCard
- Brand colors, DM Sans typography
- Hover interaction (background shift instead of card lift)
- All data fetching and filtering logic

### What's Removed

- Description text (compact row can't fit it)
- Full 4-column metadata grid (License only — rest on detail page)
- "Explore Tools" button (replaced with `→` link)

## Component Plan

1. **Create `ToolRow.vue`** — compact single-line row component
2. **Modify `CardsContainer.vue`** — swap grid for flex-col, render `<ToolRow>` instead of `<Card>`
3. **Keep `Card.vue`** — file retained for potential future use

## Files Affected

| File | Action |
|------|--------|
| `src/components/ToolRow.vue` | Create |
| `src/components/CardsContainer.vue` | Modify |
| `src/components/Card.vue` | No changes (kept for reference) |
