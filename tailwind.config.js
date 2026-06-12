/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Midnight Slate + Warm Amber design system
        primary: {
          DEFAULT: '#4A51E0',
          300: '#848CF3',
          400: '#6269ED',
          500: '#4A51E0',
          600: '#3A40C4',
          700: '#2D32A0',
          800: '#21267A',
        },
        accent: {
          DEFAULT: '#E8AC1A',
          300: '#F5C842',
          400: '#E8AC1A',
          500: '#C9880D',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#60A5FA',
        background: '#0E0F14',
        surface: '#161820',
        elevated: '#1E2030',
        overlay: '#252838',
        subtle: '#12131A',
        secondary: '#1E2030',
        border: {
          DEFAULT: '#2A2D3E',
          muted: '#1F2131',
          strong: '#3D4160',
          focus: '#C9A84C',
        },
        'text-primary': '#F0F1FA',
        'text-muted': '#A8AABE',
        'text-faint': '#666880',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2)',
        'card-hover':
          '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 10px 15px -3px rgba(0,0,0,0.4)',
        'btn-accent': '0 4px 15px rgba(232,172,26,0.2)',
        'btn-accent-hover': '0 4px 25px rgba(232,172,26,0.35)',
        'btn-primary': '0 4px 15px rgba(74,81,224,0.2)',
        'glow-amber': '0 0 20px rgba(232,172,26,0.15)',
        'glow-indigo': '0 0 20px rgba(74,81,224,0.15)',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 172, 26, 0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgba(232, 172, 26, 0)' },
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
