/** @type {import('tailwindcss').Config} */

// UniGoh brand colors
// Lapis (primary): #1E3A8A
// Apricot (accent): #F59E0B
// Cream (background): #FEF3C7
const lapis = {
  50: '#eff4ff',
  100: '#dbe6fe',
  200: '#bfd3fe',
  300: '#93b4fd',
  400: '#6090fa',
  500: '#3b6cf6',
  600: '#2552e0',
  700: '#1e40af',
  800: '#1e3a8a',
  900: '#172e6b',
  950: '#0f1d45',
};

const apricot = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: lapis,
        apricot,
        cream: '#FFFBF2',
        // Legacy indigo/purple classes map to brand colors automatically
        indigo: lapis,
        purple: apricot,
        emeraldCustom: '#059669',
      },
    },
  },
  plugins: [],
}
