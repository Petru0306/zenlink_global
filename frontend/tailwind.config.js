/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'zenlink-dark': '#0B0F2A',
        'zenlink-blue': '#4A9FFF',
      },
    },
  },
  plugins: [],
}

