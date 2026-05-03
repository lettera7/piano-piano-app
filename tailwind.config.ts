import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#fdfaf5',
          100: '#faf4e8',
          200: '#f5e9d2',
          DEFAULT: '#faf4e8',
        },
        sage: {
          50:  '#f2f7f2',
          100: '#e0ece0',
          200: '#b8d4b8',
          300: '#8abb8a',
          400: '#5e9e5e',
          500: '#3d7a3d',
          600: '#2e5e2e',
          700: '#1f4220',
          DEFAULT: '#5e9e5e',
        },
        golden: {
          100: '#fef9e7',
          200: '#fdf0c0',
          300: '#f9d84a',
          400: '#f0c020',
          DEFAULT: '#f9d84a',
        },
        terracotta: {
          100: '#fdf0eb',
          200: '#f9d4c0',
          300: '#f0a07a',
          400: '#e07040',
          DEFAULT: '#f0a07a',
        },
        warmgray: {
          50:  '#fafaf8',
          100: '#f4f4f0',
          200: '#e8e8e0',
          300: '#d0d0c4',
          400: '#a8a898',
          500: '#787868',
          600: '#585848',
          700: '#404038',
          800: '#282820',
          DEFAULT: '#585848',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 2px 12px 0 rgba(60,60,40,0.07), 0 1px 3px 0 rgba(60,60,40,0.04)',
        'card-hover': '0 4px 20px 0 rgba(60,60,40,0.12), 0 2px 6px 0 rgba(60,60,40,0.06)',
        'bottom-nav': '0 -1px 0 0 rgba(60,60,40,0.08), 0 -4px 16px 0 rgba(60,60,40,0.06)',
      },
    },
  },
  plugins: [],
}
export default config
