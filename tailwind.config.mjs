/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:   '#0E0D0D',
        panel: '#1B1918',
        cream: '#F5E8D0',
        body:  '#B4AA9A',
        accent: {
          DEFAULT: '#BB3F2F',
          dark:    '#85372E',
        },
        gold:     '#E6B649',
        charcoal: '#5D5954',
        // decorative — baked into illustrations only, never UI fills
        brick: '#664A3F',
        stone: '#443D37',
        plant: '#48524E',
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'sans-serif'],
        gothic:  ['"Pirata One"', 'serif'],
        ui:      ['Oswald', 'system-ui', 'sans-serif'],
        impact:  ['Bangers', 'cursive'],
        comic:   ['"Comic Neue"', 'cursive'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        ui:       '0.12em',
        wide:     '0.18em',
      },
      boxShadow: {
        'comic':      '4px 4px 0 #0E0D0D',
        'comic-red':  '4px 4px 0 #BB3F2F',
        'comic-card': '5px 5px 0 #BB3F2F',
        'comic-cream':'4px 4px 0 #F5E8D0',
      },
      backgroundImage: {
        'grunge':          "url('/assets/textures/grunge-bg.jpg')",
        'halftone-cream':  "url('/assets/textures/halftone-cream.png')",
        'halftone-ink':    "url('/assets/textures/halftone-ink.png')",
        'halftone-red':    "url('/assets/textures/halftone-red.png')",
        'bricks':          "url('/assets/textures/brick-wall.jpg')",
        'city':            "url('/assets/textures/city-backdrop.jpg')",
      },
    },
  },
  plugins: [],
};
