/** @type {import('tailwindcss').Config} */
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
          elevated: '#f9fafb',
          card: '#ffffff',
          dark: '#111827',
        },
        accent: {
          blue: '#0ea5e9',
          pink: '#f472b6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'xl': '1rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}