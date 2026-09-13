import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-roboto)", "Arial", "Helvetica", "sans-serif"],
      },
      colors: {
        // Gold/amber - primary action color (buttons, active icons, highlights).
        // Matches the actual Akkhor reference template's accent color.
        primary: {
          50: "#fff8e6",
          100: "#ffefc2",
          200: "#ffe08a",
          300: "#ffce52",
          400: "#ffbc29",
          500: "#ffae01",
          600: "#e89900",
          700: "#c17e00",
          800: "#9c6400",
          900: "#7a4f00",
        },
        // Deep navy - sidebar, header, secondary buttons. Matches the actual
        // Akkhor reference template's dark chrome color.
        navy: {
          50: "#eaf0f7",
          100: "#c9d8e8",
          200: "#9db6d1",
          300: "#6f92b8",
          400: "#3f6c9d",
          500: "#0b4776",
          600: "#083a63",
          700: "#063050",
          800: "#042954",
          850: "#051f3e",
          900: "#021933",
        },
      },
      boxShadow: {
        card: "0px 10px 20px 0px rgba(229, 229, 229, 0.6)",
        login: "0px 5px 49px 0px rgba(0, 0, 0, 0.35)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
