import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        paper: "#f7f6f1",
        line: "#d8d7cd",
        leaf: "#0f766e",
        coral: "#d85c45",
        mist: "#e7f0ed"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 33, 31, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
