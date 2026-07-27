import { describe, expect, it } from 'vitest'
import { debounce, deepMergeObject, popProperty, throttle, toArray } from '../src/quick.js'

describe('quick', () => {
  it('should pop property correctly', () => {
    const obj = { a: 1, b: 2 }
    expect(popProperty(obj, 'a')).toBe(1)
    expect(obj).toEqual({ b: 2 })
    // @ts-ignore
    expect(popProperty(obj, 'c')).toBeUndefined()
  })

  it('should deep merge objects correctly', () => {
    const obj1 = { a: 1, b: { c: 2 } }
    const obj2 = { b: { d: 3 }, e: 4 }
    const result = deepMergeObject(obj1, obj2)
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 })
  })

  it('should debounce function calls', () => {
    let callCount = 0
    const debouncedFn = debounce(() => callCount++, 100)
    debouncedFn()
    debouncedFn()
    debouncedFn()
    setTimeout(() => {
      expect(callCount).toBe(1)
    }, 200)
  })

  it('should throttle function calls', () => {
    let callCount = 0
    const throttledFn = throttle(() => callCount++, 100)
    throttledFn()
    throttledFn()
    throttledFn()
    setTimeout(() => {
      expect(callCount).toBe(1)
    }, 50)
    setTimeout(() => {
      expect(callCount).toBe(2)
    }, 200)
  })
  it('should toArray function calls', () => {
    expect(toArray(1)).toEqual([1])
    expect(toArray('hello')).toEqual(['hello'])
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3])
    expect(toArray(['a', 'b'])).toEqual(['a', 'b'])
    expect(toArray(null)).toEqual([null])
    expect(toArray(undefined)).toEqual([undefined])
    const obj = { x: 1 }
    expect(toArray(obj)).toEqual([obj])
    const arr = [obj]
    expect(toArray(arr)).toBe(arr)
  })

  describe('debounce cancel', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('should cancel pending execution before delay', () => {
      let callCount = 0
      const debouncedFn = debounce(() => callCount++, 100)
      debouncedFn()
      // 在延迟到达前取消，回调不应执行
      debouncedFn.cancel()
      vi.advanceTimersByTime(200)
      expect(callCount).toBe(0)
    })

    it('should not throw when cancel called with no pending timer', () => {
      const debouncedFn = debounce(() => {}, 100)
      expect(() => debouncedFn.cancel()).not.toThrow()
    })

    it('should allow scheduling again after cancel', () => {
      let callCount = 0
      const debouncedFn = debounce(() => callCount++, 100)
      debouncedFn()
      debouncedFn.cancel()
      vi.advanceTimersByTime(200)
      expect(callCount).toBe(0)
      // 取消后再次调用应正常生效
      debouncedFn()
      vi.advanceTimersByTime(100)
      expect(callCount).toBe(1)
    })

    it('should only cancel the latest pending call', () => {
      let callCount = 0
      const debouncedFn = debounce(() => callCount++, 100)
      debouncedFn()
      debouncedFn()
      // 取消的是最后一次待执行的调用
      debouncedFn.cancel()
      vi.advanceTimersByTime(200)
      expect(callCount).toBe(0)
    })
  })

  describe('throttle cancel', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('should cancel pending execution before delay', () => {
      let callCount = 0
      const throttledFn = throttle(() => callCount++, 100)
      throttledFn()
      // 在冷却期内取消，回调不应执行
      throttledFn.cancel()
      vi.advanceTimersByTime(200)
      expect(callCount).toBe(0)
    })

    it('should not throw when cancel called with no pending timer', () => {
      const throttledFn = throttle(() => {}, 100)
      expect(() => throttledFn.cancel()).not.toThrow()
    })

    it('should reset cooldown and allow new calls after cancel', () => {
      let callCount = 0
      const throttledFn = throttle(() => callCount++, 100)
      throttledFn()
      throttledFn.cancel()
      vi.advanceTimersByTime(200)
      expect(callCount).toBe(0)
      // 取消后冷却状态被重置，可重新触发
      throttledFn()
      vi.advanceTimersByTime(100)
      expect(callCount).toBe(1)
    })

    it('should not affect future calls after cooldown completes', () => {
      let callCount = 0
      const throttledFn = throttle(() => callCount++, 100)
      throttledFn()
      vi.advanceTimersByTime(100)
      expect(callCount).toBe(1)
      // 冷却已自然结束，取消不应影响后续调用
      throttledFn.cancel()
      throttledFn()
      vi.advanceTimersByTime(100)
      expect(callCount).toBe(2)
    })

    it('should keep blocking calls during cooldown', () => {
      let callCount = 0
      const throttledFn = throttle(() => callCount++, 100)
      throttledFn()
      // 冷却期内的重复调用应被拦截
      throttledFn()
      throttledFn()
      vi.advanceTimersByTime(100)
      expect(callCount).toBe(1)
    })
  })
})
