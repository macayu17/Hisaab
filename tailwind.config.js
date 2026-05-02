/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#080C10",
        mist: "#F0EDE8",
        amber: "#F5A320",
        settled: "#4ADE80",
        danger: "#FFB4AB",
        forgiven: "#A78BFA",
      },
      fontFamily: {
        display: ["Cinzel_700Bold"],
        body: ["Montserrat_400Regular"],
      },
    },
  },
  plugins: [],
};

