import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#07111f",
        ink: "#111827",
        teal: {
          50: "#ecfeff",
          100: "#cffafe",
          500: "#0f9f9a",
          600: "#0d817d",
          700: "#0f6866"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(7, 17, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
