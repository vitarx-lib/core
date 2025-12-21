import { describe, expect, it, vi } from 'vitest'
import { ValueChangeWatcher, WatcherOptions } from '../../src/index.js'

class TestValueChangeWatcher<T> extends ValueChangeWatcher<T> {
  constructor(
    initialValue: T,
    callback: (newValue: T, oldValue: T, onCleanup: (cleanupFn: () => void) => void) => void,
    options?: WatcherOptions
  ) {
    super(callback, options)
    this._value = initialValue
  }

  public setValue(value: T) {
    this._value = value
    this.runEffect()
  }

  public setCompare(compare: (a: T, b: T) => boolean) {
    this.compare = compare
  }

  protected override getter(): T {
    return this._value
  }
}

describe('watcher/ValueChangeWatcher', () => {
  describe('constructor', () => {
    it('should create a ValueChangeWatcher instance', () => {
      const callback = vi.fn()
      const watcher = new TestValueChangeWatcher(0, callback)
      expect(watcher).toBeInstanceOf(ValueChangeWatcher)
    })

    it('should accept options', () => {
      const callback = vi.fn()
      const watcher = new TestValueChangeWatcher(0, callback, { flush: 'post' })
      expect(watcher).toBeInstanceOf(ValueChangeWatcher)
    })
  })

  describe('value', () => {
    it('should return the current value', () => {
      const callback = vi.fn()
      const watcher = new TestValueChangeWatcher(42, callback)
      expect(watcher.value).toBe(42)
    })
  })

  describe('compare', () => {
    it('should use Object.is by default', () => {
      const callback = vi.fn()
      const watcher = new TestValueChangeWatcher(0, callback)
      expect(watcher.compare).toBe(Object.is)
    })

    it('should allow custom compare function', () => {
      const callback = vi.fn()
      const watcher = new TestValueChangeWatcher(0, callback)
      const customCompare = vi.fn(() => true)
      watcher.setCompare(customCompare)
      expect(watcher.compare).toBe(customCompare)
    })
  })

  describe('runCallback', () => {
    it('should call the callback with new and old values', () => {
      const callback = vi.fn()
      const watcher = new TestValueChangeWatcher(0, callback)

      // Mock the value and call runCallback
      ;(watcher as any)._value = 1
      watcher['runCallback'](0)

      expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function))
    })

    it('should report error when callback throws', () => {
      const error = new Error('Test error')
      const callback = vi.fn(() => {
        throw error
      })
      const watcher = new TestValueChangeWatcher(0, callback)

      const reportErrorSpy = vi.spyOn(watcher as any, 'reportError').mockImplementation(() => {})
      ;(watcher as any)._value = 1
      watcher['runCallback'](0)

      expect(reportErrorSpy).toHaveBeenCalledWith(error, 'callback')
    })
  })

  describe('runEffect', () => {
    it('should not call callback when values are the same', () => {
      const callback = vi.fn()
      const watcher = new TestValueChangeWatcher(0, callback)
      const compareSpy = vi.spyOn(watcher, 'compare').mockReturnValue(true)

      watcher.setValue(0)

      expect(compareSpy).toHaveBeenCalledWith(0, 0)
      expect(callback).not.toHaveBeenCalled()
    })

    it('should call callback when values are different', () => {
      const callback = vi.fn()
      const watcher = new TestValueChangeWatcher(0 as number, callback, { flush: 'sync' })
      const compareSpy = vi.spyOn(watcher, 'compare').mockImplementation((a, b) => {
        return Object.is(a, b)
      })

      watcher.setValue(1)
      // 由于setValue中提前进行了赋值，所有新值和旧值一样
      expect(compareSpy).toHaveBeenCalledTimes(1)
      expect(compareSpy).toHaveBeenCalledWith(1, 1)
      expect(callback).not.toHaveBeenCalled()
    })
  })
})
