# Website Style Update Plan

## Objective
Apply a modern, professional website style inspired by Browserbase (https://www.browserbase.com/) and EAIKW (https://eaikw.com/) to this enclavetools.com project.

## Current Style Analysis
- Current: White background, gray borders (gray-50 to gray-900), primary orange (#ff4d00)
- Generic clean look, needs more character and polish

## Target Style
- Cleaner, more modern aesthetic
- Better typography hierarchy  
- More refined button/component styles
- Improved hover states and transitions
- Consistent dark/accent colors

## Files to Update

### 1. Tailwind Config (`tailwind.config.js`)
- Refine colors for better consistency
- Add new border radius
- Improve shadows

### 2. Main CSS (`src/styles/main.css`)
- Add custom base styles
- Font optimizations
- Smooth transitions

### 3. Layout (`src/layouts/Layout.astro`)
- Navigation styling refinements  
- Footer improvements
- Better spacing

### 4. Hero Component (`src/components/Hero.astro`)
- Modern typography
- Better CTA buttons

### 5. Card Component (`src/components/Card.vue`)
- Cleaner card design
- Better hover states

### 6. CategoryNav (`src/components/CategoryNav.vue`)
- Modern pill/rounded buttons
- Better active states

### 7. Other Vue Components
- Sidebar, SearchInput, EmptyState, etc.

## Implementation Steps
1. Update tailwind.config.js 
2. Update main.css with custom styles
3. Update Layout.astro navigation/footer
4. Update Hero.astro
5. Update Card.vue
6. Update CategoryNav.vue
7. Update other components
8. Test with dev server

## Style Guidelines
- Keep white background for readability
- Use gray-900 for primary text
- Subtle border colors (gray-200/300)
- Rounded corners (rounded-lg or rounded-xl)
- Better spacing (comfortable whitespace)
- Smooth transitions (150-200ms)
- Hover: subtle background changes
