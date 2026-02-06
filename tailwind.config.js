/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    defaultTheme: "mytheme",
    themes: [
      {
        mytheme: {
          "primary": "oklch(55% 0.3 240)",
          "primary-content": "oklch(98% 0.01 240)",

          "secondary": "oklch(70% 0.25 200)",
          "secondary-content": "oklch(98% 0.01 200)",

          "accent": "oklch(65% 0.25 160)",
          "accent-content": "oklch(98% 0.01 160)",

          "neutral": "oklch(50% 0.05 240)",
          "neutral-content": "oklch(98% 0.01 240)",

          "base-100": "oklch(98% 0.02 240)",
          "base-200": "oklch(95% 0.03 240)",
          "base-300": "oklch(92% 0.04 240)",
          "base-content": "oklch(20% 0.05 240)",

          "info": "oklch(70% 0.2 220)",
          "info-content": "oklch(98% 0.01 220)",

          "success": "oklch(65% 0.25 140)",
          "success-content": "oklch(98% 0.01 140)",

          "warning": "oklch(80% 0.25 80)",
          "warning-content": "oklch(20% 0.05 80)",

          "error": "oklch(65% 0.3 30)",
          "error-content": "oklch(98% 0.01 30)",

          /* radius */
          "--rounded-box": "0.5rem",
          "--rounded-btn": "1rem",
          "--rounded-badge": "0.25rem",

          /* border size */
          "--border": "1px",

          /* effects */
          "--depth": "1",
          "--noise": "0",
        },
      },
    ],
  },
}
