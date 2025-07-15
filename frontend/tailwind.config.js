/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Allow Tailwind to use the CSS variables defined in index.css
      colors: {
        'theme-bg': 'var(--background-color)',
        'theme-text-primary': 'var(--primary-text-color)',
        'theme-text-secondary': 'var(--secondary-text-color)',
        'theme-border': 'var(--border-color)',
        'theme-accent-1': 'var(--accent-color-1)',
        'theme-accent-3': 'var(--accent-color-3)',
        'theme-card': 'var(--card-background)',
        'theme-button-primary-bg': 'var(--button-primary-bg)',
        'theme-button-primary-text': 'var(--button-primary-text)',
      }
    },
  },
  plugins: [],
}
