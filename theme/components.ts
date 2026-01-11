/**
 * Component shortcuts
 * Aligned with console-ui @rialtic/theme patterns
 */

export const components = {
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
