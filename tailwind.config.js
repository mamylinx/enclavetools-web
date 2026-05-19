/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF8C00',
          50: '#FFF4E6',
          100: '#FFE8CC',
          200: '#FFD199',
          300: '#FFBA66',
          400: '#FFA333',
          500: '#FF8C00',
          600: '#CC7000',
          700: '#995400',
          800: '#663800',
          900: '#331C00',
        },
        surface: {
          DEFAULT: '#1A1A1A',
          elevated: '#242424',
          card: '#2A2A2A',
        },
        accent: {
          DEFAULT: '#FF8C00',
          hover: '#FFA333',
          muted: '#996600',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      boxShadow: {
        card: '0 0 0 0.5px rgba(255, 140, 0, 0.05), 0 1px 1px -0.5px rgba(0, 0, 0, 0.04), 0 3px 3px -1.5px rgba(0, 0, 0, 0.04), 0 12px 12px -6px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 0 0 1px #FF8C00, 0 1px 1px -0.5px rgba(0, 0, 0, 0.04), 0 3px 3px -1.5px rgba(0, 0, 0, 0.04), 0 12px 12px -6px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}