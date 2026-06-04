/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
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
        'card-hover': '0 8px 24px rgba(0,0,0,0.08)',
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
