/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FAF8F5',
          dark: '#1B361B',
          forest: '#1B361B',
          teal: '#05B2A3',
          tealLight: '#E8F7F5',
          lime: '#BFFF00',
          sand: '#FFFFFF',
          muted: '#2D4A2D',
          tag: '#E8F7F5',
          indigo: '#5D3FD3',
          indigoLight: '#F3EFFF',
          cyanBg: '#E8F7F5',
          darkGreen: '#1B361B',
          slateTeal: '#FAF8F5',
          magenta: '#05B2A3',
          deepViolet: '#1B361B',
          yellowBg: '#E8F7F5',
          lavenderBg: '#E8F7F5',
          royalBlue: '#0052CC',
          footerBg: '#140B0B',
          lightCyan: '#E8F7F5',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
      },
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.5' }],
        'sm': ['1.125rem', { lineHeight: '1.5' }],
        'base': ['1.4375rem', { lineHeight: '1.6' }],
        'lg': ['1.75rem', { lineHeight: '1.5' }],
        'xl': ['2.125rem', { lineHeight: '1.4' }],
        '2xl': ['2.5rem', { lineHeight: '1.3' }],
        '3xl': ['3rem', { lineHeight: '1.2' }],
        '4xl': ['3.5rem', { lineHeight: '1.15' }],
        '5xl': ['4.5rem', { lineHeight: '1.1' }],
        '6xl': ['5.625rem', { lineHeight: '1.05' }],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
}
