import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbfa",
          100: "#d3f4f1",
          400: "#2bb8ad",
          500: "#0f9c8f", // primary teal
          600: "#0c7e74",
          900: "#0b2e3a", // deep navy for headers/sidebar
        },
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};

export default config;
