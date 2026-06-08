#!/usr/bin/env bash
# Swiss neo-brutalism design-system spacing lint.
# Fails if any forbidden Tailwind values leak into the codebase.
#
# Run: bun run lint:spacing
#   or: bash scripts/lint-spacing.sh

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SEARCH_PATHS=(
  "src/layouts"
  "src/components"
  "src/pages"
)

EXTS=(--glob '*.astro' --glob '*.vue' --glob '*.tsx' --glob '*.jsx')

# Pick rg if available, fall back to grep -R
if command -v rg >/dev/null 2>&1; then
  SEARCH_CMD="rg --no-heading --line-number --color=never"
else
  SEARCH_CMD="grep -RInE"
  EXTS=()
fi

FAIL=0

check() {
  local label="$1"
  local pattern="$2"
  local matches
  if command -v rg >/dev/null 2>&1; then
    matches=$($SEARCH_CMD "${EXTS[@]}" -e "$pattern" "${SEARCH_PATHS[@]}" 2>/dev/null || true)
  else
    matches=$(grep -RInE --include='*.astro' --include='*.vue' --include='*.tsx' --include='*.jsx' -e "$pattern" "${SEARCH_PATHS[@]}" 2>/dev/null || true)
  fi
  if [[ -n "$matches" ]]; then
    echo "FORBIDDEN [$label] -> $pattern"
    echo "$matches" | sed 's/^/  /'
    FAIL=1
  fi
}

# Off-grid half steps (not on 4px multiples)
check "half-steps" '\b(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y|top|right|bottom|left|inset)-(0\.5|1\.5|2\.5|3\.5)\b'

# Tailwind spacing values that are off the clean 4-unit scale
# (allowed: 0,1,2,3,4,6,8,10,12,16,20,24,32,40,48,64,80,96)
SCALE_PFX='(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y|top|right|bottom|left|inset)'
SCALE_BAD='(5|7|9|11|13|14|18|22|28)'
check "off-scale" "\\b${SCALE_PFX}-${SCALE_BAD}\\b"

# Legacy min-h values that have been replaced by h-12
check "min-h-44"  'min-h-\[44px\]'
check "min-h-48"  'min-h-\[48px\]'
check "min-h-130" 'min-h-\[130px\]'

# 1px border (must be border-2)
# Matches `border ` (border as a class followed by another class) — not `border-2` etc.
check "border-1px" '\bborder\s+(border-|bg-|text-|p-|m-|hover:|focus:)' 

# Soft-corner radius leaks (allowed: rounded-none, rounded-full for circles)
check "rounded-soft" '\brounded-(sm|md|lg|xl|2xl|3xl)\b'

if [[ $FAIL -ne 0 ]]; then
  echo ""
  echo "Spacing lint FAILED. Replace forbidden values with the canonical scale."
  echo "  Allowed spacing: 0,1,2,3,4,6,8,10,12,16,20,24,32,40,48,64,80,96"
  echo "  Borders: border-2 (no bare 'border')"
  echo "  Radii: rounded-none or rounded-full only"
  exit 1
fi

echo "Spacing lint OK."
