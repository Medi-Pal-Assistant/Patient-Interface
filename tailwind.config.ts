import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
        chat: {
          user: "#e0f2fe",
          bot: "#f3f4f6",
          input: "#ffffff",
        },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      maxWidth: {
        'chat': '42rem',
      },
      keyframes: {
        pulse: {
          '0%': { transform: 'scale(0.95)', opacity: '1' },
          '100%': { transform: 'scale(1.2)', opacity: '0' },
        }
      },
      animation: {
        pulse: 'pulse 1.5s ease-out infinite',
      },
      transitionDelay: {
        '750': '750ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
