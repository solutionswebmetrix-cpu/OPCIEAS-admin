/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#071A35', 2: '#0B2745', 3: '#103258' },
        gold: { DEFAULT: '#D4AF37', 2: '#E8C766', 3: '#B8932B' },
        silver: { DEFAULT: '#C0C0C0' },
        dark: { DEFAULT: '#090909', 2: '#111111' },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      borderRadius: { lux: '20px', lg2: '16px' },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        sub: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      spacing: { 18: '4.5rem', 22: '5.5rem', 30: '7.5rem' },
      maxWidth: { '8xl': '1440px' },
      boxShadow: {
        card: '0 4px 24px -8px rgba(15, 23, 42, 0.08)',
        'card-lg': '0 12px 40px -12px rgba(15, 23, 42, 0.12)',
        'gold-sm': '0 0 16px rgba(212, 175, 55, 0.35)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.35s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
