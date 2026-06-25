export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        navy: "#1f3a5f",
        teal: "#177e89",
        gold: "#c79a3b",
        paper: "#f7f4ed",
      },
      boxShadow: {
        soft: "0 14px 35px rgba(23, 32, 42, 0.10)",
      },
    },
  },
  plugins: [],
}
