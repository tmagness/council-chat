/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#111118',
        'bg-tertiary': '#1a1a24',
        'bg-elevated': '#222230',
        'border-primary': '#2a2a3a',
        'border-secondary': '#3a3a4a',
        'text-primary': '#f0f0f5',
        'text-secondary': '#8888a0',
        'text-muted': '#5555668',
        'accent-blue': '#00d4ff',
        'accent-green': '#00ff88',
        'accent-amber': '#ffaa00',
        'accent-red': '#ff4455',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
