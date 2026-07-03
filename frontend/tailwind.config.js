/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202d",
        muted: "#7c8493",
        canvas: "#f2f4f5",
        panel: "#ffffff",
        line: "#dfe5e8",
        brand: {
          50: "#eef8f1",
          100: "#dff2e7",
          500: "#1f9b55",
          600: "#178845",
          700: "#0f6d3a",
          900: "#074832"
        },
        signal: {
          blue: "#2f63ec",
          orange: "#f59e0b",
          red: "#ef4444"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"]
      },
      boxShadow: {
        subtle: "0 1px 0 rgba(15, 23, 42, 0.02)"
      }
    }
  },
  plugins: []
};
