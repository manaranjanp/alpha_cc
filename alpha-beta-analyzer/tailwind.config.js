/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        'deep-navy': '#0a1628',
        'midnight': '#132039',
        'ocean': '#1a2f4a',

        // Accent colors
        'cyan': {
          DEFAULT: '#22d3ee',
          light: '#67e8f9',
          dark: '#06b6d4',
        },
        'gold': {
          DEFAULT: '#fbbf24',
          light: '#fcd34d',
          dark: '#f59e0b',
        },

        // Status colors
        primary: '#22d3ee',
        success: '#10B981',
        warning: '#fbbf24',
        danger: '#EF4444',

        // Slate tones
        'slate-custom': {
          DEFAULT: '#e2e8f0',
          dark: '#cbd5e1',
        },
      },
      fontFamily: {
        heading: ['Spectral', 'serif'],
        body: ['Manrope', 'sans-serif'],
      },
      animation: {
        'gradient-shift': 'gradientShift 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'slide-in-right': 'slideInRight 0.8s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
}
