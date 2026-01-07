import { useToast as useVueToast } from 'vue-toastification'

/**
 * Toast notification composable
 * Provides consistent toast notifications across the app
 */
export function useToast() {
  const toast = useVueToast()

  /**
   * Show a success toast
   */
  const success = (message: string) => {
    toast.success(message)
  }

  /**
   * Show an error toast
   */
  const error = (message: string) => {
    toast.error(message)
  }

  /**
   * Show a warning toast
   */
  const warning = (message: string) => {
    toast.warning(message)
  }

  /**
   * Show an info toast
   */
  const info = (message: string) => {
    toast.info(message)
  }

  /**
   * Clear all toasts
   */
  const clear = () => {
    toast.clear()
  }

  return {
    success,
    error,
    warning,
    info,
    clear,
    // Also expose the raw toast for advanced usage
    toast,
  }
}
