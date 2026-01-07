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
          500: '#1B5E37',
          600: '#164b2d',
        },
        accent: {
          500: '#8DC63F',
        },
        neutral: {
          50: '#F9FBF9',
          900: '#2D3436',
        },
        warning: {
          500: '#E67E22',
        },
      },
    },
  },
  plugins: [],
}

