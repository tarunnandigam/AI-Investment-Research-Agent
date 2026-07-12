/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          base:    '#0b0f1a',
          surface: '#111827',
          card:    '#1a2235',
        },
        invest: { DEFAULT: '#00c896', dim: 'rgba(0,200,150,0.1)' },
        pass:   { DEFAULT: '#ff4d4f', dim: 'rgba(255,77,79,0.1)' },
        watch:  { DEFAULT: '#fbbf24', dim: 'rgba(251,191,36,0.1)' },
        accent: { DEFAULT: '#6366f1', dim: 'rgba(99,102,241,0.12)' },
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          hover:   'rgba(255,255,255,0.14)',
        },
      },
      animation: {
        'spin-slow':   'spin-slow 4s linear infinite',
        'pulse-ring':  'pulse-ring 2s ease-in-out infinite',
        'float':       'float 3s ease-in-out infinite',
        'fade-up':     'fadeUp 0.5s ease-out forwards',
        'shimmer':     'shimmer 1.5s infinite',
      },
      keyframes: {
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'pulse-ring': {
          '0%,100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fadeUp': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: { xs: '4px' },
    },
  },
  plugins: [],
};
