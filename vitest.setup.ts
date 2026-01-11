/**
 * Vitest setup file
 * Aligned with console-ui @rialtic/ui testing patterns
 */
import { type DOMWrapper, type VueWrapper, config } from '@vue/test-utils'
import { expect, vi } from 'vitest'
import type { Component } from 'vue'

// Mock Nuxt auto-imports
vi.mock('#imports', () => ({
  ref: vi.fn((val) => ({ value: val })),
  computed: vi.fn((fn) => ({ value: fn() })),
  reactive: vi.fn((obj) => obj),
  watch: vi.fn(),
  watchEffect: vi.fn(),
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  useRoute: vi.fn(() => ({
    path: '/',
    params: {},
    query: {},
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  navigateTo: vi.fn(),
  useRuntimeConfig: vi.fn(() => ({
    public: {},
  })),
}))

// Type definitions for custom test utilities
type CSSSelectorWildcard = '*' | '^' | '$'
type FindByTestIdReturnType<T> = T extends Element
  ? DOMWrapper<T>
  : T extends Component
    ? VueWrapper<T>
    : DOMWrapper<Element>
type FindByTestId = <T>(
  selector: string,
  wildcard?: CSSSelectorWildcard,
) => FindByTestIdReturnType<T>
type FindAllByTestId = <T>(
  selector: string,
  wildcard?: CSSSelectorWildcard,
) => FindByTestIdReturnType<T>[]

// Extend Vue Test Utils wrapper with custom matchers
declare module '@vue/test-utils' {
  export interface VueWrapper {
    findByTestId: FindByTestId
    findAllByTestId: FindAllByTestId
  }
}

// Test ID Plugin for data-testid selectors
// https://test-utils.vuejs.org/guide/extending-vtu/plugins#Data-Test-ID-Plugin
const TestIdPlugin = (wrapper: VueWrapper) => {
  const findByTestId: FindByTestId = <T>(
    selector: string,
    wildcard?: CSSSelectorWildcard,
  ) => {
    const dataSelector = `[data-testid${wildcard || ''}="${selector}"]`
    const component = wrapper.findComponent(dataSelector)

    if (component.exists()) {
      return component as FindByTestIdReturnType<T>
    }

    return wrapper.find(dataSelector) as FindByTestIdReturnType<T>
  }

  const findAllByTestId: FindAllByTestId = <T>(
    selector: string,
    wildcard?: CSSSelectorWildcard,
  ) => {
    const dataSelector = `[data-testid${wildcard || ''}="${selector}"]`
    const components = wrapper.findAllComponents(dataSelector)

    if (components.length) {
      return components as FindByTestIdReturnType<T>[]
    }

    return wrapper.findAll(dataSelector) as FindByTestIdReturnType<T>[]
  }

  return {
    findByTestId,
    findAllByTestId,
  }
}

config.plugins.VueWrapper.install(TestIdPlugin)

// Custom matchers
interface CustomMatchers<R = unknown> {
  toExist: () => R
}

declare module 'vitest' {
  interface Assertion<T = unknown> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

// https://vitest.dev/api/expect.html#expect-extend
expect.extend({
  toExist(received) {
    const pass =
      !!received &&
      (typeof received?.exists === 'function' ? received.exists() : true)

    return {
      pass,
      message: () =>
        pass
          ? 'Expected element not to exist, but it does'
          : 'Expected element to exist, but it does not',
    }
  },
})

// Global test utilities
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
