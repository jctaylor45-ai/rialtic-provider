import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWind,
  transformerDirectives,
} from 'unocss'
import presetWebFonts from '@unocss/preset-web-fonts'

// CSS Variables for runtime theming (aligned with console-ui patterns)
const cssVariables = {
  // Primary colors
  '--color-primary-50': '#E8EAF7',
  '--color-primary-100': '#C6CAEB',
  '--color-primary-200': '#949FDE',
  '--color-primary-300': '#6F7CCD',
  '--color-primary-400': '#5C6CC6',
  '--color-primary-500': '#3F52BC',
  '--color-primary-600': '#3848A4',
  '--color-primary-700': '#2F3D8A',
  '--color-primary-800': '#273170',
  '--color-primary-900': '#1C214B',
  // Secondary colors
  '--color-secondary-50': '#E1F5FD',
  '--color-secondary-100': '#A3E0F9',
  '--color-secondary-200': '#81D5F6',
  '--color-secondary-300': '#4FC4F1',
  '--color-secondary-400': '#28B7F0',
  '--color-secondary-500': '#00ABEE',
  '--color-secondary-600': '#009DDF',
  '--color-secondary-700': '#0E93C8',
  '--color-secondary-800': '#0270A2',
  '--color-secondary-900': '#005181',
  // Neutral colors
  '--color-neutral-50': '#F5F6F8',
  '--color-neutral-100': '#EBEFF2',
  '--color-neutral-200': '#DCE1EA',
  '--color-neutral-300': '#CDD4E1',
  '--color-neutral-400': '#B4BFD2',
  '--color-neutral-500': '#9BAAC4',
  '--color-neutral-600': '#8590A3',
  '--color-neutral-700': '#707683',
  '--color-neutral-800': '#4C5862',
  '--color-neutral-900': '#293446',
  // Semantic colors
  '--color-success-500': '#00A788',
  '--color-success-600': '#00856D',
  '--color-warning-400': '#F2A425',
  '--color-warning-500': '#CD830C',
  '--color-error-500': '#DC627D',
  '--color-error-700': '#BD2949',
  // Surface colors
  '--color-surface': '#FFFFFF',
  '--color-surface-bg': '#F5F6F8',
}

// Typography shortcuts (aligned with @rialtic/theme)
const typography = {
  'text-large-1': 'text-5xl md:text-6xl font-medium',
  'text-large-2': 'text-4xl md:text-5xl font-medium',
  'text-large-3': 'text-3xl md:text-4xl font-medium leading-10',
  'text-large-4': 'text-2xl md:text-3xl font-medium leading-9 tracking-[0.1px]',
  'text-large-5': 'text-xl md:text-2xl font-semibold leading-8 tracking-[-0.3px]',
  'h1': 'text-lg md:text-xl font-medium leading-7',
  'h2': 'text-base md:text-lg font-medium tracking-[0.1px] leading-7',
  'h3': 'text-base font-medium tracking-[0.1px] leading-6',
  'subtitle-1': 'text-sm font-medium leading-5',
  'subtitle-2': 'text-xs font-medium tracking-[0.1px] leading-4.5',
  'body-1': 'text-sm font-normal tracking-[0.1px] leading-5',
  'body-2': 'text-xs font-normal tracking-[0.1px] leading-4.5',
  'italic-1': 'text-sm font-normal italic tracking-[0.1px] leading-5',
  'italic-2': 'text-xs font-normal italic tracking-[0.1px] leading-4.5',
  'text-button-1': 'text-sm font-normal tracking-[0.1px] leading-5',
  'text-button-2': 'text-xs font-semibold tracking-[0.1px] leading-4.5',
  'table-numbers-1': 'text-sm font-normal tracking-[0.1px] leading-normal font-fixed',
  'table-numbers-2': 'text-xs font-normal tracking-[0.1px] leading-normal font-fixed',
}

// Component shortcuts (aligned with @rialtic/theme)
const components = {
  // Buttons
  'btn': 'flex justify-center items-center px-4 py-2 border rounded-lg space-x-2 transition-colors',
  'btn-icon': 'p-1 rounded-full',
  'btn-filled': 'bg-secondary-600 border-secondary-600 text-white hover:bg-secondary-800 hover:border-secondary-800 disabled:bg-neutral-300 disabled:hover:bg-neutral-300 disabled:border-neutral-300 disabled:hover:border-neutral-300',
  'btn-outlined': 'bg-transparent border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-900 font-medium hover:text-neutral-900 disabled:hover:bg-transparent disabled:border-neutral-400 disabled:hover:border-neutral-400 disabled:text-neutral-400 disabled:hover:text-neutral-400',
  'btn-text': 'p-0 bg-transparent border-transparent body-1 text-left text-secondary-600 hover:text-secondary-700 visited:text-secondary-800 disabled:text-neutral-400 disabled:hover:text-neutral-400',

  // Forms
  'form-input': 'ring-secondary-100 focus:border-secondary-600 block flex w-full rounded-lg border border-neutral-200 p-2.5 text-left text-sm text-neutral-900 outline-none ring-offset-1 focus:shadow-inner focus:ring-2 focus:bg-neutral-50',
  'form-input-error': 'border-error-500 bg-error-100',
  'input-invalid': 'border-error-500 bg-error-light text-error-700',

  // Cards
  'card': 'bg-surface shadow rounded-lg',

  // Checkbox & Radio
  'checkbox': 'aspect-ratio-square relative appearance-none m-0 text-sm h-4 w-4 rounded border border-neutral-300 leading-none checked:border-secondary-500 transition-all duration-100 outline-none bg-neutral-50 checked:bg-secondary-600 after:transition after:origin-center after:rounded after:transform-gpu after:scale-80 checked:after:scale-100 after:duration-300 hover:ring-1 focus:ring-2 ring-secondary-200 after:content-empty after:opacity-0 checked:after:opacity-100 after:absolute after:top-0 after:left-0 after:h-3 after:w-3 checked:after:bg-white checked:after:i-ph-check-bold disabled:border-neutral-100 disabled:cursor-not-allowed',
  'checkbox-indeterminate': 'after:i-ph-minus-bold text-neutral-400 after:opacity-100! after:transform after:translate-x-[1.2px] after:translate-y-[1.4px] after:scale-x-70',
  'radio': 'checked:border-5 checked:border-secondary focus:ring-secondary-200 inline-block h-4 w-4 cursor-pointer appearance-none rounded-full border border-neutral-300 bg-neutral-100 outline-none ring-offset-2 transition-all focus:ring-2',

  // Containers
  'filter-item-container': 'max-h-[62vh] overflow-y-auto flex-1',
}

export default defineConfig({
  presets: [
    presetWind(),
    presetUno(),
    presetAttributify(),
    presetTypography(),
    presetIcons({
      collections: {
        fluent: () => import('@iconify-json/fluent/icons.json').then(i => i.default),
        heroicons: () => import('@iconify-json/heroicons/icons.json').then(i => i.default),
        'heroicons-solid': () => import('@iconify-json/heroicons-solid/icons.json').then(i => i.default),
        ph: () => import('@iconify-json/ph/icons.json').then(i => i.default),
      },
    }),
    presetWebFonts({
      provider: 'google',
      fonts: {
        display: [
          { name: 'Poppins', weights: ['400', '500', '600', '700'], italic: true },
          { name: 'system-ui', provider: 'none' },
          { name: 'sans-serif', provider: 'none' },
        ],
        fixed: [
          { name: 'Nunito', weights: ['400', '600'] },
          { name: 'system-ui', provider: 'none' },
          { name: 'sans-serif', provider: 'none' },
        ],
        poppins: [
          { name: 'Poppins', weights: ['400', '500', '600', '700'], italic: true },
        ],
      },
    }),
  ],
  transformers: [transformerDirectives()],
  preflights: [
    {
      getCSS: () => {
        const vars = Object.entries(cssVariables)
          .map(([key, value]) => `  ${key}: ${value};`)
          .join('\n')
        return `:root {\n${vars}\n}`
      },
    },
  ],
  shortcuts: {
    ...typography,
    ...components,
  },
  theme: {
    fontSize: {
      xxs: '.625rem',
    },
    colors: {
      // Rialtic Primary - Blue
      primary: {
        dark: '#1C214B',
        DEFAULT: '#3F52BC',
        light: '#6F7CCD',
        50: '#E8EAF7',
        75: '#D0D4EF',
        100: '#C6CAEB',
        200: '#949FDE',
        300: '#6F7CCD',
        400: '#5C6CC6',
        500: '#3F52BC',
        600: '#3848A4',
        700: '#2F3D8A',
        800: '#273170',
        900: '#1C214B',
      },
      // Rialtic Secondary - Cyan
      secondary: {
        dark: '#0E93C8',
        DEFAULT: '#28B7F0',
        light: '#A3E0F9',
        50: '#E1F5FD',
        100: '#A3E0F9',
        200: '#81D5F6',
        300: '#4FC4F1',
        400: '#28B7F0',
        500: '#00ABEE',
        600: '#009DDF',
        700: '#0E93C8',
        800: '#0270A2',
        900: '#005181',
      },
      // Rialtic Tertiary - Teal
      tertiary: {
        dark: '#1E9BA6',
        DEFAULT: '#35CDDA',
        light: '#B5ECF1',
        50: '#EDFAFC',
        75: '#E5F8FA',
        100: '#DAF6F8',
        200: '#B5ECF1',
        300: '#91E3EB',
        400: '#7EDFE7',
        500: '#35CDDA',
        600: '#47BBC2',
        700: '#1E9BA6',
        800: '#007E88',
        900: '#0F4D53',
      },
      // Neutral - Grays
      neutral: {
        dark: '#707683',
        DEFAULT: '#FFF',
        light: '#F5F6F8',
        50: '#F5F6F8',
        100: '#EBEFF2',
        200: '#DCE1EA',
        300: '#CDD4E1',
        400: '#B4BFD2',
        500: '#9BAAC4',
        600: '#8590A3',
        700: '#707683',
        800: '#4C5862',
        900: '#293446',
      },
      // Surface colors
      surface: {
        bg: '#F5F6F8',
        DEFAULT: '#FFF',
      },
      // Error - Red
      error: {
        dark: '#CB3F5E',
        DEFAULT: '#E45D7B',
        light: '#FCF1F3',
        100: '#F9E2E7',
        300: '#E99AAB',
        500: '#DC627D',
        700: '#BD2949',
      },
      // Exclusion - Orange
      exclusion: {
        DEFAULT: '#FCEDD4',
        dark: '#754B07',
        medium: '#583805',
        light: '#FEF9F1',
      },
      // Success - Green
      success: {
        DEFAULT: '#31AA8F',
        dark: '#00856D',
        50: '#F0F9F7',
        100: '#D1ECE6',
        200: '#B2DFD5',
        300: '#83CCBD',
        400: '#55B9A3',
        500: '#00A788',
        600: '#00856D',
        700: '#2B695B',
        800: '#24574C',
        900: '#15342E',
      },
      // Warning - Yellow/Orange
      warning: {
        DEFAULT: '#F6BD60',
        dark: '#F2A425',
        50: '#FEF9F1',
        100: '#FCEDD4',
        200: '#F8CF8B',
        300: '#F6BD60',
        400: '#F2A425',
        500: '#CD830C',
        600: '#B0710A',
        700: '#935E09',
        800: '#754B07',
        900: '#583805',
        950: '#411b09',
      },
    },
  },
})
