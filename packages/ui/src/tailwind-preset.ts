import type { Config } from "tailwindcss";

/**
 * Subfy Design System — Tailwind CSS Preset
 *
 * All tokens are extracted from the Figma design file.
 */
export const subfyPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        /* ── Brand / Main ─────────────────────────── */
        main: {
          400: "#7C5CFF",
          500: "#8B7CFF",
          600: "#4F4781",
        },

        /* ── Neutrals / Backgrounds ───────────────── */
        neutral: {
          900: "#191C27",
          950: "#151721",
        },

        /* ── Dark tones (cards, borders) ──────────── */
        dark: {
          500: "#25293A",
          600: "#1B1F3B",
          700: "#23285E",
        },

        /* ── Text ─────────────────────────────────── */
        "text-primary": "#EDE6FF",
        "text-secondary": "#837F8D",

        /* ── Accent / Status ──────────────────────── */
        success: {
          DEFAULT: "#2FE6C8",
          muted: "#32D1B7",
          bg: "rgba(50, 209, 183, 0.25)",
          border: "rgba(47, 230, 200, 0.5)",
        },
        danger: {
          DEFAULT: "#FF6B6B",
          bg: "rgba(255, 107, 107, 0.25)",
          border: "rgba(255, 107, 107, 0.5)",
        },

        /* ── Surface ──────────────────────────────── */
        light: "#F4F5F7",

        /* ── Sidebar ──────────────────────────────── */
        sidebar: {
          DEFAULT: "#191C27",
          border: "#25293A",
          active: "#8B7CFF",
        },
      },

      fontFamily: {
        sora: ["var(--font-sora)", "Sora", "sans-serif"],
        outfit: ["var(--font-outfit)", "Outfit", "sans-serif"],
        inter: ["var(--font-inter)", "Inter", "sans-serif"],
        sans: ["var(--font-sora)", "Sora", "sans-serif"],
      },

      fontSize: {
        /* ── Display / Headings — Sora Bold ───────── */
        "display-1": [
          "72px",
          { lineHeight: "1", fontWeight: "700", letterSpacing: "0" },
        ],
        "display-2": [
          "48px",
          { lineHeight: "1", fontWeight: "700", letterSpacing: "0" },
        ],
        "display-3": [
          "32px",
          { lineHeight: "1", fontWeight: "700", letterSpacing: "0" },
        ],

        /* ── Body ─────────────────────────────────── */
        "body-lg": [
          "20px",
          { lineHeight: "1", fontWeight: "500", letterSpacing: "0" },
        ],
        "body-md": [
          "18px",
          { lineHeight: "1", fontWeight: "400", letterSpacing: "0" },
        ],
        "body-base": [
          "16px",
          { lineHeight: "28px", fontWeight: "400", letterSpacing: "0" },
        ],
        "body-sm": [
          "14px",
          { lineHeight: "20px", fontWeight: "400", letterSpacing: "0" },
        ],
        "body-xs": [
          "12px",
          { lineHeight: "1", fontWeight: "400", letterSpacing: "0" },
        ],
      },

      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },

      spacing: {
        "4.5": "18px",
        "7": "28px",
        "13": "52px",
        sidebar: "340px",
      },

      keyframes: {
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-left": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },

      animation: {
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-out-to-left": "slide-out-to-left 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
      },
    },
  },
};

export default subfyPreset;
