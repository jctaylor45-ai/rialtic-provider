// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // SPA mode (no SSR, aligned with Rialtic)
  ssr: false,

  // Modern ES modules
  future: {
    compatibilityVersion: 4,
  },

  // App configuration
  app: {
    head: {
      title: 'Provider Portal',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Healthcare Provider Portal' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  // Modules
  modules: [
    '@unocss/nuxt',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/icon',
  ],

  // UnoCSS configuration
  unocss: {
    preflight: true,
    attributify: true,
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // Vite configuration
  vite: {
    vue: {
      script: {
        defineModel: true,
        propsDestructure: true,
      },
    },
  },

  // Runtime config (can be overridden with env variables)
  runtimeConfig: {
    public: {
      apiBase: '/api',
    },
  },

  // Auto-imports
  imports: {
    dirs: ['stores', 'composables', 'utils'],
  },

  // Development
  devtools: { enabled: true },

  compatibilityDate: '2024-01-01',
})
