import { defineConfig, presetAttributify, presetIcons, presetWind } from 'unocss'

export default defineConfig({
  presets: [
    presetWind(), // Tailwind-compatible preset
    presetAttributify(),
    presetIcons({
      collections: {
        fluent: () => import('@iconify-json/fluent/icons.json').then(i => i.default),
        heroicons: () => import('@iconify-json/heroicons/icons.json').then(i => i.default),
        ph: () => import('@iconify-json/ph/icons.json').then(i => i.default),
      },
    }),
  ],
  theme: {
    colors: {
      // Brand colors (can be customized)
      primary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5', // Main brand color
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
        950: '#1e1b4b',
      },
    },
  },
})
