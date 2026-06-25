/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#294936", leaf: "#58784f", moss: "#8ca36f", cream: "#f8f4ea",
        oat: "#ebe1cb", clay: "#a85f3d", turmeric: "#d8a72d", ink: "#26342b"
      },
      fontFamily: { sans: ["DM Sans", "sans-serif"], display: ["Fraunces", "serif"] },
      boxShadow: { soft: "0 18px 50px rgba(41,73,54,.10)" }
    }
  },
  plugins: []
};
