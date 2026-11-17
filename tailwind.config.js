/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Control Room" palette
        ink: {
          950: '#07080c',
          900: '#0b0d13',
          800: '#10131b',
          700: '#171b26',
          600: '#222838',
        },
        signal: {
          DEFAULT: '#35e0f2', // electric cyan
          soft: '#8ff0fa',
          deep: '#0e8fa1',
        },
        amber: {
          glow: '#ffb547', // warm highlight, used sparingly
        },
        // Lifted from Tailwind's defaults so small captions pass WCAG AA (4.5:1) on ink-700..950.
        slate: {
          500: '#8593a8',
          600: '#78869b',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        signal: '0 0 0 1px rgba(53,224,242,.35), 0 0 32px -6px rgba(53,224,242,.45)',
        amber: '0 10px 40px -12px rgba(255,181,71,.55)',
      },
    },
  },
  plugins: [],
};
