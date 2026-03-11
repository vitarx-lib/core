import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { flushSync, ref, trackEffect, Watcher } from '../../src/index.js'

class TestWatcher extends Watcher {
  public runEffectCount = 0
  protected runEffect(): void {
    this.runEffectCount++
  }
}

class ReactiveTestWatcher extends Watcher {
  public runEffectCount: number
  constructor(
    private readonly signal: { value: number },
    options?: ConstructorParameters<typeof Watcher>[0]
  ) {
    super(options)
    this.runEffectCount = 0
    this.runEffect()
  }
  protected runEffect(): void {
    trackEffect(() => this.signal.value, this.effectHandle)
    this.runEffectCount++
  }
}

describe('watcher/Watcher', () => {
  describe('constructor', () => {
    it('should create a Watcher instance with default options', () => {
      const watcher = new TestWatcher()
      expect(watcher).toBeInstanceOf(Watcher)
      expect(watcher).toBeInstanceOf(TestWatcher)
    })

    it('should create a Watcher instance with custom flush option', () => {
      const watcher = new TestWatcher({ flush: 'post' })
      expect(watcher).toBeInstanceOf(Watcher)
    })

    it('should create a Watcher instance with invalid flush option and use default', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const watcher = new TestWatcher({ flush: 'invalid' as any })
      expect(watcher).toBeInstanceOf(Watcher)
      expect(warnSpy).toHaveBeenCalledWith(
        '[Watcher] Invalid flush option "invalid", using "pre" as default'
      )
      warnSpy.mockRestore()
    })
  })

  describe('scheduler', () => {
    it('should execute sync flush immediately when dependency changes', () => {
      const signal = ref(0)
      const watcher = new ReactiveTestWatcher(signal, { flush: 'sync' })

      expect(watcher.runEffectCount).toBe(1)

      signal.value = 1

      expect(watcher.runEffectCount).toBe(2)

      watcher.dispose()
    })

    it('should defer pre flush execution until flushSync', () => {
      const signal = ref(0)
      const watcher = new ReactiveTestWatcher(signal, { flush: 'pre' })

      expect(watcher.runEffectCount).toBe(1)

      signal.value = 1

      expect(watcher.runEffectCount).toBe(1)

      flushSync()

      expect(watcher.runEffectCount).toBe(2)

      watcher.dispose()
    })

    it('should defer post flush execution until flushSync', () => {
      const signal = ref(0)
      const watcher = new ReactiveTestWatcher(signal, { flush: 'post' })

      expect(watcher.runEffectCount).toBe(1)

      signal.value = 1

      expect(watcher.runEffectCount).toBe(1)

      flushSync()

      expect(watcher.runEffectCount).toBe(2)

      watcher.dispose()
    })
  })

  describe('onCleanup', () => {
    it('should add cleanup function to cleanups array', () => {
      const watcher = new TestWatcher()
      const cleanupFn = vi.fn()

      watcher.onCleanup(cleanupFn)
      // We can't easily verify the cleanup function was added without accessing private members
    })

    it('should throw error when cleanup function is not a function', () => {
      const watcher = new TestWatcher()

      expect(() => {
        watcher.onCleanup('not-a-function' as any)
      }).toThrow('[onWatcherCleanup] Invalid cleanup function.')
    })
  })

  describe('beforeDispose', () => {
    it('should run cleanup and clear effect deps', async () => {
      const watcher = new TestWatcher()
      const runCleanupSpy = vi.spyOn(watcher as any, 'runCleanup')
      const clearEffectDepsSpy = vi.spyOn(
        await import('../../src/core/signal/index.js'),
        'clearEffectLinks'
      )

      watcher['beforeDispose']()

      expect(runCleanupSpy).toHaveBeenCalled()
      expect(clearEffectDepsSpy).toHaveBeenCalled()
    })
  })

  describe('reportError', () => {
    it('should call parent reportError with prefixed source', () => {
      const watcher = new TestWatcher()
      const superReportErrorSpy = vi
        .spyOn(Object.getPrototypeOf(Watcher.prototype), 'reportError' as any)
        .mockImplementation(() => {})
      const error = new Error('Test error')
      watcher['reportError'](error, 'test')

      expect(superReportErrorSpy).toHaveBeenCalledWith(error, 'watcher.test')
    })
  })

  describe('runCleanup', () => {
    it('should execute all cleanup functions', () => {
      const watcher = new TestWatcher()
      const cleanup1 = vi.fn()
      const cleanup2 = vi.fn()

      watcher.onCleanup(cleanup1)
      watcher.onCleanup(cleanup2)
      watcher['runCleanup']()

      expect(cleanup1).toHaveBeenCalled()
      expect(cleanup2).toHaveBeenCalled()
    })

    it('should report error when cleanup function throws', () => {
      const watcher = new TestWatcher()
      const error = new Error('Test error')
      const cleanup = vi.fn(() => {
        throw error
      })

      const reportErrorSpy = vi.spyOn(watcher as any, 'reportError').mockImplementation(() => {})
      watcher.onCleanup(cleanup)
      watcher['runCleanup']()

      expect(reportErrorSpy).toHaveBeenCalledWith(error, 'cleanup')
    })

    it('should not re-execute cleanups after array is cleared', () => {
      const watcher = new TestWatcher()
      const cleanup = vi.fn()

      watcher.onCleanup(cleanup)
      watcher['runCleanup']()

      expect(cleanup).toHaveBeenCalledTimes(1)

      watcher['runCleanup']()

      expect(cleanup).toHaveBeenCalledTimes(1)
    })
  })
})
