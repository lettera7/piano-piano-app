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
        cream:   { DEFAULT: '#f5f0e8', dark: '#ece5d8' },
        ink:     { DEFAULT: '#1a1714', mid: '#4a453e', light: '#8a8278', faint: '#c8c0b4' },
        orange:  { DEFAULT: '#f05a28', dark: '#d04318', pale: '#fde8df' },
        sage:    { DEFAULT: '#3d7a52', light: '#dceee3' },
        gold:    { DEFAULT: '#e8b84b', pale: '#fdf4dc' },
        // Keep legacy for any remaining refs
        warmgray: {
          50:  '#faf9f7', 100: '#f2f0ec', 200: '#e4e0d8',
          300: '#ccc8bc', 400: '#9a9888', 500: '#6a6858',
          600: '#4a4840', 700: '#343228', 800: '#1e1c18',
          DEFAULT: '#4a4840',
        },
        sage5: {
          50: '#f0f7f2', 100: '#daeee2', 200: '#b0d9be',
          300: '#7ab88e', 400: '#4a8b5c', 500: '#2e6040',
          DEFAULT: '#4a8b5c',
        },
        golden: {
          100: '#fef6d8', 200: '#fce9a0', 300: '#e8c547',
          DEFAULT: '#e8c547',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem', '3xl': '1.25rem', '4xl': '1.75rem', '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
export default config
