/**
 * Enclavetools — Swiss Neo-Brutalism Design System
 * Tokens documented here. Enforced by scripts/lint-spacing.sh.
 *
 * SPACING (4pt base — use existing Tailwind core tokens only)
 *   Hairline : 1  (4px)
 *   Tight    : 2  (8px)
 *   Chip     : 3  (12px)
 *   Standard : 4  (16px)
 *   Section  : 6  (24px)
 *   Spacious : 8  (32px)
 *   py-compact   : 8  (32px)
 *   py-standard  : 12 (48px)
 *   py-major     : 16 (64px)
 *   py-hero      : 16 / 24  (64 mobile / 96 desktop)
 *   FORBIDDEN    : 0.5, 1.5, 2.5, 3.5, 5, 7, 9, 11, 13, 14, 18, 22, 28
 *
 * GAP LADDER
 *   gap-2 tight · gap-3 standard · gap-4 relaxed
 *   gap-6 section · gap-8 major · gap-12 hero
 *
 * CARD PADDING LADDER
 *   p-4 compact (chips, table cells, form subsection)
 *   p-6 standard (tool cards, form sections, scorecard rows)
 *   p-8 spacious (form wrapper, legal wrapper)
 *
 * SECTION VERTICAL RHYTHM
 *   py-8  compact (pagination, between filter bar and grid)
 *   py-12 standard (tool sections, compare, stack)
 *   py-16 major (saved, legal, footer)
 *   py-16 lg:py-24 hero
 *
 * MAX-WIDTH LADDER (4 rungs only)
 *   max-w-[800px]  prose   (legal pages)
 *   max-w-[640px]  form    (single-column forms — not yet used)
 *   max-w-[1200px] content (long-form editorial — reserved)
 *   max-w-[1400px] shell   (header, footer, all main sections)
 *
 * BUTTON HEIGHTS
 *   h-10 40 (chips, sort pills, mobile icon buttons w-10 h-10)
 *   h-12 48 DEFAULT — every primary action
 *   h-14 56 (hero CTA — reserved)
 *   FORBIDDEN : min-h-[44px], min-h-[130px]
 *
 * BORDER
 *   border-2      only weight for content edges
 *   border-b-2    only horizontal section dividers
 *   NEVER border  (1px) — the brutalist signature is 2px hard outlines
 *   border-dashed reserved for empty/suggestion states
 *
 * RADIUS
 *   rounded-none global — kill all rounded-{md,lg,t-2xl,full}
 *
 * HEADING-TO-CONTENT MARGIN
 *   h1 mb-8 · h2 mb-6 · h3 mb-4 · h4 mb-3 · eyebrow mb-2
 *
 * OUTER WRAPPER (one rule for every max-w-[1400px] mx-auto block)
 *   class="max-w-[1400px] mx-auto px-4 md:px-8"
 *
 * ACCENT PALETTE — 8 OKLCH hues at L=0.78, C=0.16
 *   Hue rotates 0→360° in 8 equal steps. Same lightness + chroma
 *   as each other means all 8 sit in the same perceptual family.
 *   Lighter than the brand primary (L=0.67) so dark text (text-gray-900)
 *   remains AA-readable on top.
 */

/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff4d00',
          50: '#fff0e6',
          100: '#ffdbcc',
          200: '#ffb899',
          300: '#ff9466',
          400: '#ff7033',
          500: '#ff4d00',
          600: '#cc3d00',
          700: '#992e00',
          800: '#661f00',
          900: '#330f00',
        },
        surface: {
          DEFAULT: '#ffffff',
          elevated: '#f5f5f4',
          card: '#ffffff',
          dark: '#111827',
        },
        accent: {
          blue: '#0ea5e9',
          pink: '#f472b6',
          'hue-1': '#e8b582',
          'hue-2': '#e5d77f',
          'hue-3': '#c5d889',
          'hue-4': '#92d5a7',
          'hue-5': '#85d0d6',
          'hue-6': '#9bb8e0',
          'hue-7': '#bba1da',
          'hue-8': '#dca0c8',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '4px 4px 0px 0px rgba(17, 24, 39, 1)',
        'brutal': '4px 4px 0px 0px rgba(17, 24, 39, 1)',
      },
      borderRadius: {
        'xl': '1rem',
        card: '0.75rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [
    forms,
  ],
}
