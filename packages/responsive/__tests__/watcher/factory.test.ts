import { describe, expect, it, vi } from 'vitest'
import { computed, flushSync, reactive, ref, signal, watch } from '../../src/index.js'

describe('watcher/factory', () => {
  describe('watch', () => {
    it('should watch a signal and call callback on change', async () => {
      const signalInstance = signal(0)
      const callback = vi.fn()

      const watcher = watch(signalInstance, callback)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Change signal value
      signalInstance(1)
      flushSync()
      // Callback should be called with new and old values
      expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function))

      watcher.dispose()
    })

    it('should watch a ref and call callback on change', async () => {
      const refInstance = ref(0)
      const callback = vi.fn()

      const watcher = watch(refInstance, callback)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Change ref value
      refInstance.value = 1
      flushSync()
      // Callback should be called with new and old values
      expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function))

      watcher.dispose()
    })

    it('should watch a computed and call callback on change', async () => {
      const signalInstance = signal(0)
      const computedInstance = computed(() => signalInstance() * 2)
      const callback = vi.fn()

      const watcher = watch(computedInstance, callback)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Change signal value, which should trigger computed update
      signalInstance(1)
      flushSync()
      // Callback should be called with new and old values
      expect(callback).toHaveBeenCalledWith(2, 0, expect.any(Function))

      watcher.dispose()
    })

    it('should watch a reactive object and call callback on change', async () => {
      const reactiveInstance = reactive({ count: 0 })
      const callback = vi.fn()

      const watcher = watch(reactiveInstance, callback)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Change reactive property
      reactiveInstance.count = 1
      flushSync()
      // Callback should be called
      expect(callback).toHaveBeenCalled()

      watcher.dispose()
    })

    it('should support immediate option', async () => {
      const signalInstance = signal(0)
      const callback = vi.fn()

      const watcher = watch(signalInstance, callback, { immediate: true, flush: 'sync' })

      // Callback should be called immediately with current value
      expect(callback).toHaveBeenCalledWith(0, 0, expect.any(Function))

      // Change signal value
      signalInstance(1)

      // Callback should be called again
      expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function))

      watcher.dispose()
    })

    it('should support once option', async () => {
      const signalInstance = signal(0)
      const callback = vi.fn()

      const watcher = watch(signalInstance, callback, { once: true })

      // Change signal value first time
      signalInstance(1)
      flushSync()
      // Callback should be called
      expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function))

      // Change signal value second time
      signalInstance(2)

      // Callback should not be called again
      expect(callback).toHaveBeenCalledTimes(1)

      // Watcher should be isDeprecated
      expect(watcher.isDeprecated).toBe(true)
    })

    it('should watch a getter function', async () => {
      const signalInstance = signal(0)
      const callback = vi.fn()

      const watcher = watch(() => signalInstance() * 2, callback)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Change signal value
      signalInstance(1)
      flushSync()
      // Callback should be called with new and old values
      expect(callback).toHaveBeenCalledWith(2, 0, expect.any(Function))

      watcher.dispose()
    })

    it('should watch an array of sources', async () => {
      const signal1 = signal(0)
      const signal2 = signal(1)
      const callback = vi.fn()

      const watcher = watch([signal1, signal2], callback)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Change first signal
      signal1(2)
      flushSync()
      // Callback should be called
      expect(callback).toHaveBeenCalledWith([2, 1], [0, 1], expect.any(Function))

      watcher.dispose()
    })
  })
})
