module.exports = {
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        scaleUp: {
          "0%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)" },
        },
        pulseFast: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        pulseSlow: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
        },
        pulseSlower: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.5" },
          "50%": { transform: "scale(1.25)", opacity: "1" },
        },
      },
      animation: {
        slideUp: "slideUp 0.3s ease-out",
        fadeIn: "fadeIn 0.25s ease-out forwards",
        scaleUp: "scaleUp 0.25s ease-out forwards",
        pulseFast: "pulseFast 1.2s ease-in-out infinite",
        pulseSlow: "pulseSlow 6s ease-in-out infinite",
        pulseSlower: "pulseSlower 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
