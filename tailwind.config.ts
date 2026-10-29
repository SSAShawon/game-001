import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          900: "#0a0b0f",
          800: "#12141b",
          700: "#1a1d26",
          600: "#252933",
        },
        glacial: "#82D9F5",
        orchid: "#E9A5D1",
        lavender: "#B7A7FF",
        amber: "#F5C56A",
        danger: "#F48FB1",
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
      },
      boxShadow: {
        game: "0 0 30px rgba(0,0,0,0.6)",
        glow: "0 0 14px rgba(130,217,245,0.15)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
