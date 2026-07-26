import { describe, expect, it, vi } from 'vitest'
import { ref } from '../../src/index.js'
import { GetterWatcher } from '../../src/watcher/getter.js'

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

      // 构造时初始化 getter 抛错：构造函数 try-catch 捕获并 reportError，不中断构造
      const watcher = new TestValueWatcher(getter, callback, {})

      // 构造时 reportError 已被调用（getter 在构造函数中执行一次）
      expect(getter).toHaveBeenCalledTimes(1)
      expect(mockReportError).toHaveBeenCalledWith(error, 'getter')

      // getter() 直接调用：异常向上抛出（不再吞错返回 undefined as T），
      // 由 ValueWatcher.runEffect 的 try-catch 统一捕获处理
      expect(() => watcher['getter']()).toThrow(error)
    })
  })
})
