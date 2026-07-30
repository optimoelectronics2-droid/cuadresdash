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
        primary: { DEFAULT: "#1A237E", light: "#534BAE", dark: "#000051" },
        secondary: { DEFAULT: "#2E7D32", light: "#60AD5E", dark: "#005005" },
        danger: { DEFAULT: "#C62828", light: "#FF5F52", dark: "#8E0000" },
        warning: { DEFAULT: "#E65100", light: "#FF8441", dark: "#AC1900" },
        surface: { DEFAULT: "#F5F5F5", dark: "#121212" },
        card: { DEFAULT: "#FFFFFF", dark: "#1E1E1E" },
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};
export default config;
