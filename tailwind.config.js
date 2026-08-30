/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aether: {
          dark: "#0a0717",
          panel: "#120e24",
          border: "#3b2a59",
          brass: "#c89b3c",
          brassGlow: "#ffd700",
          cyan: "#00f0ff",
          purple: "#9d4edd",
          crimson: "#ff2a5f",
          emerald: "#00e676"
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'brass': '0 0 15px rgba(200, 155, 60, 0.4), inset 0 0 10px rgba(200, 155, 60, 0.2)',
        'aether': '0 0 20px rgba(0, 240, 255, 0.35)',
        'void': '0 0 20px rgba(157, 78, 221, 0.45)',
        'golden': '0 0 25px rgba(255, 215, 0, 0.6), inset 0 0 15px rgba(255, 215, 0, 0.4)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'float': 'float 4s infinite ease-in-out',
        'spin-slow': 'spinSlow 20s linear infinite',
      }
    },
  },
  plugins: [],
}
