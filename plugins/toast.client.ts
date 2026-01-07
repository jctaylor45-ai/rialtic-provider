import Toast, { type PluginOptions, POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import '~/assets/css/toast.css'

export default defineNuxtPlugin((nuxtApp) => {
  const options: PluginOptions = {
    position: POSITION.TOP_RIGHT,
    timeout: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: 'button',
    icon: true,
    rtl: false,
    transition: 'Vue-Toastification__fade',
    maxToasts: 5,
    newestOnTop: true,
    // Custom styling to match Rialtic theme
    toastDefaults: {
      success: {
        timeout: 4000,
      },
      error: {
        timeout: 8000,
      },
      warning: {
        timeout: 6000,
      },
      info: {
        timeout: 5000,
      },
    },
  }

  nuxtApp.vueApp.use(Toast, options)
})
