import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0c0c10",
          50: "#26262e",
          100: "#1c1c24",
          200: "#16161c",
          300: "#111116",
          400: "#0c0c10",
          500: "#09090c",
          600: "#060608",
          700: "#030306",
        },
        accent: {
          DEFAULT: "#14a7f9",
          50: "#e7f6ff",
          100: "#b8e7fe",
          200: "#89d8fd",
          300: "#5ac9fc",
          400: "#2bbafc",
          500: "#14a7f9",
          600: "#0f86c8",
          700: "#0b6596",
        },
        muted: {
          DEFAULT: "#8b8b9e",
          50: "#d0d0da",
          100: "#8b8b9e",
          200: "#5e5e72",
          300: "#44445a",
          400: "#2e2e3e",
          500: "#1e1e2a",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.5)",
        glow: "0 0 40px rgba(20,167,249,0.12), 0 0 120px rgba(20,167,249,0.06)",
        "glow-lg": "0 0 60px rgba(20,167,249,0.18), 0 0 160px rgba(20,167,249,0.08)",
        "glow-sm": "0 0 15px rgba(20,167,249,0.2)",
        btn: "0 1px 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
