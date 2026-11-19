/** @type {import('tailwindcss').Config} */
// Light theme: white surfaces, charcoal text, orange brand (matches the HU logo).
//
// The site was built on a small set of palette names. They are remapped here, so every
// section follows the new theme:
//   white      -> charcoal text colour  (text-white = main text; bg-white/5, border-white/10 = soft dark tints)
//   ink-*      -> white / light neutral surfaces
//   slate-*    -> secondary text greys (all >= 4.5:1 on white)
//   signal     -> orange for TEXT and icons (#c2410c, 5.2:1 on white)
//   brand      -> the bright logo orange, for fills, buttons and decoration
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        white: '#14161b',
        ink: {
          950: '#ffffff',
          900: '#fbfaf9',
          800: '#f6f4f2',
          700: '#eeebe8',
          600: '#e1ddd9',
        },
        brand: {
          DEFAULT: '#ff6a00',
          soft: '#fff1e6',
          light: '#ffd9bd',
          deep: '#c2410c',
        },
        signal: {
          DEFAULT: '#c2410c',
          soft: '#ea580c',
          deep: '#9a3412',
        },
        amber: {
          glow: '#c2410c',
        },
        slate: {
          200: '#2b303b',
          300: '#3a404d',
          400: '#4a515e',
          500: '#5b6270',
          600: '#667085',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        signal: '0 0 0 1px rgba(255,106,0,.35), 0 12px 32px -10px rgba(255,106,0,.35)',
        amber: '0 12px 28px -10px rgba(255,106,0,.55)',
        card: '0 1px 2px rgba(20,22,27,.04), 0 8px 24px -12px rgba(20,22,27,.12)',
        lift: '0 2px 4px rgba(20,22,27,.05), 0 22px 44px -18px rgba(194,65,12,.35)',
      },
    },
  },
  plugins: [],
};
