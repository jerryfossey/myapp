import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ok: "#16a34a",
        due: "#d97706",
        overdue: "#dc2626",
      },
    },
  },
  plugins: [],
};

export default config;
