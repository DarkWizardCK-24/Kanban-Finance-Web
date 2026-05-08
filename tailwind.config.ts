import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Dark Vault Palette ───────────────────────────────────────
        "dark-bg": "#090E1A",
        "dark-surface": "#111827",
        "dark-card": "#141E30",
        "dark-card-alt": "#1A2438",
        "dark-border": "#253450",
        "dark-divider": "#1E2B42",

        // Text
        "text-primary": "#F0F4FF",
        "text-secondary": "#8B9DC3",
        "text-hint": "#4A5B7A",
        "text-muted": "#2E3D5A",

        // Accents
        "accent-cyan": "#4FC3F7",
        "accent-gold": "#FFD54F",
        "accent-green": "#4ADE80",
        "accent-amber": "#FBBF24",
        "accent-red": "#F87171",
        "accent-purple": "#A78BFA",
        "primary-blue": "#3B82F6",

        // Tinted backgrounds
        "light-green": "#0A1F12",
        "light-amber": "#1F1508",
        "light-cyan": "#091E2A",
        "light-blue": "#0A152A",
        "light-yellow": "#1F1C08",

        // Kanban
        "kanban-pending": "#1A1200",
        "kanban-processing": "#001525",
        "kanban-completed": "#001A0E",
        "kanban-failed": "#1A0606",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "wealth-gradient": "linear-gradient(135deg, #0D1B5E 0%, #090E1A 100%)",
        "primary-gradient": "linear-gradient(135deg, #1E3A8A 0%, #4FC3F7 100%)",
        "card-gradient": "linear-gradient(135deg, #0D1B5E 0%, #134E4A 100%)",
      },
      boxShadow: {
        card: "0 8px 18px rgba(0,0,0,0.55)",
        "card-glow": "0 6px 20px rgba(79, 195, 247, 0.08)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-x": {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-y": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 400ms ease-out forwards",
        "scale-in": "scale-in 500ms cubic-bezier(.34,1.56,.64,1) forwards",
        "slide-x": "slide-x 400ms ease-out forwards",
        "slide-y": "slide-y 400ms ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
