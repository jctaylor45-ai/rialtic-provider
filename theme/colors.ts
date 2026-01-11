/**
 * Rialtic color palette
 * Aligned with console-ui @rialtic/theme patterns
 */

export const colors = {
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
}

// CSS Variables for runtime theming
export const cssVariables = {
  // Primary colors
  '--color-primary-50': colors.primary[50],
  '--color-primary-100': colors.primary[100],
  '--color-primary-200': colors.primary[200],
  '--color-primary-300': colors.primary[300],
  '--color-primary-400': colors.primary[400],
  '--color-primary-500': colors.primary[500],
  '--color-primary-600': colors.primary[600],
  '--color-primary-700': colors.primary[700],
  '--color-primary-800': colors.primary[800],
  '--color-primary-900': colors.primary[900],
  // Secondary colors
  '--color-secondary-50': colors.secondary[50],
  '--color-secondary-100': colors.secondary[100],
  '--color-secondary-200': colors.secondary[200],
  '--color-secondary-300': colors.secondary[300],
  '--color-secondary-400': colors.secondary[400],
  '--color-secondary-500': colors.secondary[500],
  '--color-secondary-600': colors.secondary[600],
  '--color-secondary-700': colors.secondary[700],
  '--color-secondary-800': colors.secondary[800],
  '--color-secondary-900': colors.secondary[900],
  // Neutral colors
  '--color-neutral-50': colors.neutral[50],
  '--color-neutral-100': colors.neutral[100],
  '--color-neutral-200': colors.neutral[200],
  '--color-neutral-300': colors.neutral[300],
  '--color-neutral-400': colors.neutral[400],
  '--color-neutral-500': colors.neutral[500],
  '--color-neutral-600': colors.neutral[600],
  '--color-neutral-700': colors.neutral[700],
  '--color-neutral-800': colors.neutral[800],
  '--color-neutral-900': colors.neutral[900],
  // Semantic colors
  '--color-success-500': colors.success[500],
  '--color-success-600': colors.success[600],
  '--color-warning-400': colors.warning[400],
  '--color-warning-500': colors.warning[500],
  '--color-error-500': colors.error[500],
  '--color-error-700': colors.error[700],
  // Surface colors
  '--color-surface': colors.surface.DEFAULT,
  '--color-surface-bg': colors.surface.bg,
}
