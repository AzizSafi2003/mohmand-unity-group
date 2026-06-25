import type { Config } from "tailwindcss";

/**
 * Design tokens for the Mohmand Unity Group platform.
 *
 * The palette is led by a deep pine green (community, growth, the land) with a
 * restrained brass accent (heritage, value) on warm parchment — deliberately
 * NOT the generic SaaS blue/violet. Fonts: Fraunces for display headings,
 * Inter for UI/data, Vazirmatn for Pashto (Arabic script, RTL).
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14201A",
          soft: "#3A463F",
          faint: "#6B756E",
        },
        parchment: {
          DEFAULT: "#EFEDE3",
          deep: "#E6E3D6",
        },
        surface: {
          DEFAULT: "#FBFAF5",
          sunken: "#F4F2E9",
        },
        sand: "#E0DAC9",
        pine: {
          DEFAULT: "#1E4D3B",
          700: "#173E2F",
          800: "#102E23",
          300: "#5C8C77",
          100: "#DCE7E0",
        },
        moss: "#2F6B4F",
        brass: {
          DEFAULT: "#B8893B",
          soft: "#CBA565",
          dark: "#8E6A2C",
        },
        clay: "#A8553A",
        danger: "#9B2C2C",
        success: "#2F6B4F",
        warning: "#B8893B",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        ps: ["var(--font-ps)", "Tahoma", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,32,26,0.04), 0 8px 24px -12px rgba(20,32,26,0.18)",
        lift: "0 10px 40px -12px rgba(16,46,35,0.28)",
      },
      maxWidth: {
        content: "72rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
