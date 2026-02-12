import { describe, expect, it, vi } from 'vitest'
import { GetterWatcher, ref } from '../../src/index.js'

describe('watcher/GetterWatcher', () => {
  describe('constructor', () => {
    it('should create a GetterWatcher instance', () => {
      const getter = vi.fn(() => 42)
      const callback = vi.fn()
      const watcher = new GetterWatcher(getter, callback, {})

      expect(watcher).toBeInstanceOf(GetterWatcher)
      expect(getter).toHaveBeenCalled()
    })
  })

  describe('getter', () => {
    it('should collect signals and return value', () => {
      const signal = ref(42)
      const getter = vi.fn(() => signal.value)
      const callback = vi.fn()
      const watcher = new GetterWatcher(getter, callback, {})

      expect(watcher['getter']()).toBe(42)
      expect(getter).toHaveBeenCalled()
    })

    it('should report error when getter throws', () => {
      const error = new Error('Test error')
      const getter = vi.fn(() => {
        throw error
      })
      const callback = vi.fn()

      // Mock reportError to avoid throwing the error
      const mockReportError = vi.fn()

      // Create a mock class that extends ValueWatcher to override reportError
      class TestValueWatcher<T> extends GetterWatcher<T> {
        protected override reportError(e: unknown, source: string) {
          mockReportError(e, source)
        }
      }

      const watcher = new TestValueWatcher(getter, callback, {})
      const result = watcher['getter']()

      expect(mockReportError).toHaveBeenCalledWith(error, 'getter')
      expect(result).toBeUndefined()
    })
  })
})
