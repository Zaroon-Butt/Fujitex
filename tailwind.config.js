/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm, emerald-tinted dark surfaces (mirrors the mobile app's dark theme)
        night: {
          DEFAULT: '#0b0f0d',
          900: '#0b0f0d', // app background
          800: '#141916', // surface / cards
          700: '#1c231f', // muted surface
          600: '#262d28', // borders
          500: '#333b35', // strong borders
        },
        // Vibrant emerald primary — Pakistani fashion-coded jewel tone
        brand: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Gold/amber accent
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Deep rose secondary
        rose: {
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
        },
        cream: '#fef9ef',
        ink:   '#0a0a0a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      screens: {
        xs: '380px',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounce_slow: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(6px)' },
        },
      },
      animation: {
        'fade-up':   'fade-up 0.7s ease-out both',
        'bounce-slow':'bounce_slow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
