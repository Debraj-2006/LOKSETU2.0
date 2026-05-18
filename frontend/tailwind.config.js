/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        dark: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { 
          from: { opacity: 0, filter: 'blur(12px)' }, 
          to: { opacity: 1, filter: 'blur(0)' } 
        },
        slideUp: { 
          from: { opacity: 0, transform: 'translateY(30px) scale(0.96)', filter: 'blur(10px)' }, 
          to: { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' } 
        },
      },
    },
  },
  plugins: [],
};

