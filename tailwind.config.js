/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

// there is an @nx/react/tailwind helper (for many component modules I guess), we don't need it (yet).
