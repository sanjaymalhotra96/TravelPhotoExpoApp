/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6", // Main Brand Color
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        accent: {
          light: "#ff4b91",
          DEFAULT: "#ff1f75",
          dark: "#d60056",
        },
        dark: {
          bg: "#0f0f15",
          card: "#191924",
          border: "#282838",
          text: "#f3f4f6",
          muted: "#9ca3af",
        },
        light: {
          bg: "#f8fafc",
          card: "#ffffff",
          border: "#e2e8f0",
          text: "#0f172a",
          muted: "#64748b",
        },
        danger: {
          light: "#fee2e2",
          DEFAULT: "#ef4444",
          dark: "#dc2626",
        }
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        premium: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }
    },
  },
  plugins: [],
}
