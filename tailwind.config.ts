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
          50:      '#fdfaf6',
          100:     '#f7f3ec',
          200:     '#ede7da',
          DEFAULT: '#f7f3ec',
        },
        sage: {
          50:      '#f0f7f2',
          100:     '#daeee2',
          200:     '#b0d9be',
          300:     '#7ab88e',
          400:     '#4a8b5c',
          500:     '#2e6040',
          600:     '#1f4830',
          700:     '#133020',
          DEFAULT: '#4a8b5c',
        },
        golden: {
          100:     '#fef6d8',
          200:     '#fce9a0',
          300:     '#e8c547',
          400:     '#c9a820',
          DEFAULT: '#e8c547',
        },
        coral: {
          100:     '#fdf0ed',
          200:     '#f9d0ca',
          300:     '#e07060',
          400:     '#c04830',
          DEFAULT: '#e07060',
        },
        warmgray: {
          50:      '#faf9f7',
          100:     '#f2f0ec',
          200:     '#e4e0d8',
          300:     '#ccc8bc',
          400:     '#9a9888',
          500:     '#6a6858',
          600:     '#4a4840',
          700:     '#343228',
          800:     '#1e1c18',
          DEFAULT: '#4a4840',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.75rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'card':        '0 1px 4px 0 rgba(50,42,30,0.06), 0 4px 16px 0 rgba(50,42,30,0.04)',
        'card-hover':  '0 4px 24px 0 rgba(50,42,30,0.10), 0 2px 8px 0 rgba(50,42,30,0.06)',
        'bottom-nav':  '0 -1px 0 0 rgba(50,42,30,0.07), 0 -6px 20px 0 rgba(50,42,30,0.05)',
        'drawer':      '0 -4px 40px 0 rgba(30,28,24,0.18)',
        'button':      '0 2px 8px 0 rgba(74,139,92,0.25)',
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom, 16px)',
      },
    },
  },
  plugins: [],
}
export default config
