import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

const isCI = process.env.CI ?? false

export default defineConfig({
  plugins: [vue()],
  test: {
    name: 'provider-portal',
    environment: 'happy-dom',
    globals: true,
    reporters: isCI ? ['junit'] : ['default'],
    outputFile: {
      junit: 'tests/reports/junit.xml',
    },
    root: fileURLToPath(new URL('./', import.meta.url)),
    include: [
      'composables/**/*.test.ts',
      'components/**/*.test.ts',
      'stores/**/*.test.ts',
      'utils/**/*.test.ts',
      'server/**/*.test.ts',
    ],
    exclude: ['node_modules', '.nuxt', '.output', 'dist'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      all: true,
      exclude: [
        '.nuxt',
        '.output',
        'dist',
        'node_modules',
        'nuxt.config.ts',
        'uno.config.ts',
        'vitest.config.ts',
        '**/*.d.ts',
        'types/**',
      ],
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './tests/coverage',
    },
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
