import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        accent: "hsl(var(--accent))",
        danger: "hsl(var(--danger))"
      },
      boxShadow: {
        glow: "0 20px 80px rgba(40, 111, 255, 0.18)",
        premium: "0 20px 70px rgba(15, 23, 42, 0.12)"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
        "trust-gradient": "linear-gradient(135deg, rgba(37,99,235,0.16), rgba(20,184,166,0.13), rgba(255,255,255,0))"
      }
    }
  },
  plugins: [animate]
};
