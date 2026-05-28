/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#080808',
          900: '#0f0f0f',
          800: '#1a1a1a',
          700: '#242424',
          600: '#2e2e2e',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8CC6A',
          dark: '#A88A1C',
        },
        slate: {
          750: '#2d3748',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        gold: '0 0 20px rgba(212,175,55,0.25)',
      },
    },
  },
  plugins: [],
}
