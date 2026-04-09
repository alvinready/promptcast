/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-dm-serif)', 'Georgia', 'serif'],
      },
      colors: {
        bg: '#0a0a0a',
        surface: '#141414',
        surface2: '#1e1e1e',
        surface3: '#282828',
        accent: '#f5c842',
        accent2: '#e8a020',
        border: '#2a2a2a',
      },
    },
  },
  plugins: [],
}
