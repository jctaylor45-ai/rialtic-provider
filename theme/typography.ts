/**
 * Typography shortcuts
 * Aligned with console-ui @rialtic/theme patterns
 */

export const typography = {
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

export const fontConfig = {
  display: [
    { name: 'Poppins', weights: ['400', '500', '600', '700'], italic: true },
    { name: 'system-ui', provider: 'none' as const },
    { name: 'sans-serif', provider: 'none' as const },
  ],
  fixed: [
    { name: 'Nunito', weights: ['400', '600'] },
    { name: 'system-ui', provider: 'none' as const },
    { name: 'sans-serif', provider: 'none' as const },
  ],
  poppins: [
    { name: 'Poppins', weights: ['400', '500', '600', '700'], italic: true },
  ],
}
