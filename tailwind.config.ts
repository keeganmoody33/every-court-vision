import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Backwards-compat for shadcn primitives that read these as flat tokens.
        "primary-foreground": "hsl(var(--primary-foreground))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        paper: {
          DEFAULT: "hsl(var(--paper))",
          foreground: "hsl(var(--paper-foreground))",
          rule: "hsl(var(--paper-rule))",
        },

        // Court canvas (sacred — basketball metaphor preserved). The saturated values
        // are defined ONCE in globals.css as `--court-{line,wood,paint,teal,…}`; we
        // reference them here through `hsl(var(--…) / <alpha-value>)` so Tailwind
        // utilities (`fill-court-line`, `bg-court-orange/40`) and SVG inline styles
        // (`hsl(var(--court-line) / 0.4)`) agree on a single source of truth.
        court: {
          line: "hsl(var(--court-line) / <alpha-value>)",
          wood: "hsl(var(--court-wood) / <alpha-value>)",
          paint: "hsl(var(--court-paint) / <alpha-value>)",
          teal: "hsl(var(--court-teal) / <alpha-value>)",
          orange: "hsl(var(--court-orange) / <alpha-value>)",
          purple: "hsl(var(--court-purple) / <alpha-value>)",
          red: "hsl(var(--court-red) / <alpha-value>)",
          blue: "hsl(var(--court-blue) / <alpha-value>)",
          // Chrome-safe muted variants — desat 40%, lighten 15% — for use outside the
          // SVG canvas. Hex-only because they don't need to mix with inline SVG styles.
          "muted-teal": "#7ec8bd",
          "muted-orange": "#c98c5a",
          "muted-purple": "#9784b8",
          "muted-red": "#b8767c",
          "muted-blue": "#6f8db0",
        },

        // Proof-style provenance rails. Quote: "Provenance Rail: Left-side UI component
        // using color (green/purple) to track text origin" — every-design-system.md:254
        confidence: {
          direct: "hsl(var(--confidence-direct))",
          strong: "hsl(var(--confidence-strong))",
          inferred: "hsl(var(--confidence-inferred))",
          needs: "hsl(var(--confidence-needs))",
          neutral: "hsl(var(--confidence-neutral))",
        },

        halftime: {
          warm: "hsl(var(--halftime-warm))",
          cool: "hsl(var(--halftime-cool))",
        },

        arcade: {
          cyan: "hsl(var(--arcade-cyan) / <alpha-value>)",
          magenta: "hsl(var(--arcade-magenta) / <alpha-value>)",
          yellow: "hsl(var(--arcade-yellow) / <alpha-value>)",
          grid: "hsl(var(--arcade-grid) / <alpha-value>)",
        },
      },

      fontFamily: {
        // Editorial display + body — Fraunces (variable, SOFT axis) does both.
        serif: ["var(--font-fraunces)", "Iowan Old Style", "Georgia", "serif"],
        // UI chrome (nav, buttons, tables, controls).
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Stats, ticker, code.
        mono: ["var(--font-geist-mono)", "SFMono-Regular", "ui-monospace", "monospace"],
        // Telestrator chalk annotations.
        chalk: ["var(--font-chalk)", "Marker Felt", "cursive"],
        // NBA Street GameBreaker overlays only.
        gamebreaker: ["var(--font-gamebreaker)", "Impact", "sans-serif"],
      },

      // Editorial type scale — every Figure has eyebrow → title → lede → chart → caption rhythm.
      fontSize: {
        eyebrow: ["0.6875rem", { lineHeight: "1.15", letterSpacing: "0.22em", fontWeight: "500" }],
        caption: ["0.8125rem", { lineHeight: "1.55", letterSpacing: "0.005em" }],
        body: ["1.0625rem", { lineHeight: "1.68", letterSpacing: "-0.005em" }],
        lede: ["1.375rem", { lineHeight: "1.45", letterSpacing: "-0.01em", fontWeight: "400" }],
        "figure-title": ["1.5rem", { lineHeight: "1.18", letterSpacing: "-0.02em", fontWeight: "600" }],
        "essay-title": ["3rem", { lineHeight: "1.04", letterSpacing: "-0.025em", fontWeight: "600" }],
        display: ["clamp(3.25rem, 6vw + 1rem, 5.5rem)", { lineHeight: "0.96", letterSpacing: "-0.035em", fontWeight: "700" }],
        "stat-xl": ["3.75rem", { lineHeight: "0.95", letterSpacing: "-0.03em", fontWeight: "600" }],
        "stat-lg": ["2.5rem", { lineHeight: "1.0", letterSpacing: "-0.02em", fontWeight: "600" }],
      },

      letterSpacing: {
        ticker: "0.22em",
        "ticker-tight": "0.14em",
      },

      boxShadow: {
        glow: "0 0 30px hsl(var(--primary) / 0.22)",
        "orange-glow": "0 0 30px hsl(var(--court-orange) / 0.24)",
        chalk: "0 0 12px rgba(242, 210, 165, 0.18)",
        hud: "0 28px 100px -58px rgba(0,0,0,0.88)",
        paper:
          "0 1px 0 hsl(var(--paper-rule) / 0.5), 0 40px 120px -30px rgba(0,0,0,0.55), 0 8px 30px -10px rgba(0,0,0,0.4)",
      },

      backgroundImage: {
        "cover-grid":
          "linear-gradient(transparent 95%, hsl(var(--court-line) / 0.18) 95%), linear-gradient(90deg, transparent 95%, hsl(var(--court-line) / 0.14) 95%)",
        "cover-rays":
          "conic-gradient(from 220deg at 65% 40%, hsl(var(--halftime-warm) / 0.22) 0deg, hsl(var(--court-paint)) 45deg, hsl(var(--court-wood)) 130deg, hsl(var(--halftime-cool) / 0.18) 220deg, hsl(var(--court-paint)) 320deg, hsl(var(--halftime-warm) / 0.22) 360deg)",
        newsprint: "radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
      },

      backgroundSize: {
        "cover-grid": "44px 44px",
        newsprint: "3px 3px",
      },

      animation: {
        "draw-in": "draw-in 1.4s cubic-bezier(0.65, 0, 0.35, 1) forwards",
        drift: "drift 9s ease-in-out infinite",
        hologram: "hologram 3.4s linear infinite",
        count: "count-rise 700ms cubic-bezier(0.2, 0.7, 0.1, 1) both",
      },

      keyframes: {
        "draw-in": {
          from: { strokeDashoffset: "var(--length, 200)" },
          to: { strokeDashoffset: "0" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-6px,0)" },
        },
        hologram: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "count-rise": {
          from: { opacity: "0", transform: "translateY(8%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [forms],
};

export default config;
