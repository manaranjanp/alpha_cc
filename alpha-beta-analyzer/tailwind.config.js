/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Anthropic-inspired palette
        'dark-slate': '#131314',
        'charcoal': '#1a1b1c',
        'cream': 'rgb(250, 249, 240)',
        'cream-dark': 'rgb(240, 239, 230)',

        // Accent colors
        'accent-orange': {
          DEFAULT: '#d97757',
          light: '#e89579',
          dark: '#c7653f',
        },

        // Secondary colors
        'slate': {
          light: '#64748b',
          medium: '#475569',
        },
        'cloud': {
          light: '#f1f5f9',
        },

        // Status colors
        primary: '#d97757',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Source Serif 4', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'slide-in-right': 'slideInRight 0.8s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
}
