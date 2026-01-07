/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        fontFamily: {
            'sans': ['Inter', 'sans-serif'],
            'heading': ['Montserrat', 'sans-serif'],
        },
        colors: {
            // "Good Neighbor" Palette - Based on color_palette.png
            primary: {
                50: '#f0f7f3',
                100: '#d4e8db',
                200: '#a8d1b7',
                300: '#7cba93',
                400: '#50a36f',
                500: '#1B5E37', // Dark Forest Green - Base Brand Color
                600: '#164b2d',
                700: '#113823',
                800: '#0c2519',
                900: '#07120f',
            },
            accent: {
                50: '#f5fce8',
                100: '#e8f8d0',
                200: '#d1f1a1',
                300: '#baea72',
                400: '#a3e343',
                500: '#8DC63F', // Vibrant Lime Green - Accent Color
                600: '#709e32',
                700: '#547626',
                800: '#384f19',
                900: '#1c270d',
            },
            neutral: {
                50: '#F9FBF9', // Very Light Grey / Off-white
                100: '#f2f4f2',
                200: '#e5e9e5',
                300: '#d8ded8',
                400: '#cbd3cb',
                500: '#bec8be',
                600: '#a1ada1',
                700: '#849284',
                800: '#677767',
                900: '#2D3436', // Dark Charcoal Grey - Text Color
            },
            warning: {
                50: '#fef5ed',
                100: '#fde9d6',
                200: '#fbd3ad',
                300: '#f9bd84',
                400: '#f7a75b',
                500: '#E67E22', // Bright Orange - Warning/Alert
                600: '#b8651b',
                700: '#8a4c14',
                800: '#5c330d',
                900: '#2e1a07',
            },
            white: '#FFFFFF', // Pure White
        }
    },
  },
  plugins: [],
}
