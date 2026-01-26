/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF1F5',
          100: '#FADADD',
          200: '#F4A7B9',
          300: '#EF7E95',
          400: '#EA5571',
          500: '#E52C4D',
        },
        background: '#FFF1F5',
        text: '#374151',
      }
    },
  },
  plugins: [],
}
