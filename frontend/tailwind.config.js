/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        cosmic: {
          950: "#030712",
          900: "#0a0f1e",
          800: "#0f1629",
          700: "#141c35",
          600: "#1a2444",
        },
        aurora: {
          violet: "#7c3aed",
          indigo: "#4f46e5",
          cyan: "#06b6d4",
          emerald: "#10b981",
          pink: "#ec4899",
        },
      },
      backgroundImage: {
        "aurora-1": "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #06b6d4 100%)",
        "aurora-2": "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)",
        "aurora-3": "linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #4f46e5 100%)",
        "cosmic-bg": "radial-gradient(ellipse at top left, #1a1040 0%, #030712 50%, #071a2e 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "aurora": "aurora 8s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        aurora: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "glow-violet": "0 0 30px rgba(124, 58, 237, 0.4)",
        "glow-cyan": "0 0 30px rgba(6, 182, 212, 0.4)",
        "glow-emerald": "0 0 30px rgba(16, 185, 129, 0.3)",
        "card": "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
};