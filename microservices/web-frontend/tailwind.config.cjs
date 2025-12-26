module.exports = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6fbff',
          100: '#e6f1ff',
          500: '#2563eb'
        }
      },
      container: {
        center: true,
        padding: '1rem'
      }
    },
  },
  plugins: [],
};