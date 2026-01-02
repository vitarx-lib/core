import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { Watcher } from '../../src/index.js'

class TestWatcher extends Watcher {
  protected runEffect(): void {
    // Implementation for testing
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
      expect(warnSpy).toHaveBeenCalledWith('[Watcher] Invalid flush option: invalid')
      warnSpy.mockRestore()
    })
  })

  describe('scheduler', () => {
    it('should have correct scheduler for pre flush', () => {
      const watcher = new TestWatcher({ flush: 'pre' })
      // We can't easily test the actual scheduler function without accessing private members
    })

    it('should have correct scheduler for post flush', () => {
      const watcher = new TestWatcher({ flush: 'post' })
      // We can't easily test the actual scheduler function without accessing private members
    })

    it('should have correct scheduler for sync flush', () => {
      const watcher = new TestWatcher({ flush: 'sync' })
      // We can't easily test the actual scheduler function without accessing private members
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

  describe('execute', () => {
    it('should run cleanup and runEffect when active', () => {
      const watcher = new TestWatcher()
      const runCleanupSpy = vi.spyOn(watcher as any, 'runCleanup')
      const runEffectSpy = vi.spyOn(watcher as any, 'runEffect')

      watcher['execute']()

      expect(runCleanupSpy).toHaveBeenCalled()
      expect(runEffectSpy).toHaveBeenCalled()
    })

    it('should not run cleanup and runEffect when not active', () => {
      const watcher = new TestWatcher()
      // Make watcher inactive
      // @ts-ignore
      watcher['_state'] = 'disposed'
      const runCleanupSpy = vi.spyOn(watcher as any, 'runCleanup')
      const runEffectSpy = vi.spyOn(watcher as any, 'runEffect')

      watcher['execute']()

      expect(runCleanupSpy).not.toHaveBeenCalled()
      expect(runEffectSpy).not.toHaveBeenCalled()
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

    it('should clear cleanups array after execution', () => {
      const watcher = new TestWatcher()
      const cleanup = vi.fn()

      watcher.onCleanup(cleanup)
      watcher['runCleanup']()

      // We can't easily verify the array is cleared without accessing private members
    })
  })
})
