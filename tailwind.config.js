/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0F3460',
        secondary: '#16213E',
        accent: '#00D4FF',
        success: '#00C896',
        warning: '#FFB800',
        danger: '#FF3B3B',
        background: '#060B1A',
        surface: '#0D1B2E',
        border: '#1E3A5F',
        'text-primary': '#E8F4FD',
        'text-muted': '#7B9EC5',
        info: '#4D9FFF',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 212, 255, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 212, 255, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-18px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in-left': 'slide-in-left 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        float: 'float 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
