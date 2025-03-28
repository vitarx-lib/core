import { describe, expect, it } from 'vitest'
import {
  debounce,
  deepMergeObject,
  microTaskDebouncedCallback,
  popProperty,
  sleep,
  throttle
} from '../src/quick.js'

describe('quick', () => {
  it('should pop property correctly', () => {
    const obj = { a: 1, b: 2 }
    expect(popProperty(obj, 'a')).toBe(1)
    expect(obj).toEqual({ b: 2 })
    // @ts-ignore
    expect(popProperty(obj, 'c')).toBeUndefined()
  })

  it('should sleep for specified time', async () => {
    const start = Date.now()
    await sleep(100)
    const end = Date.now()
    expect(end - start).toBeGreaterThanOrEqual(100)
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

  it('should micro task debounce correctly', () => {
    let callCount = 0
    const debouncedFn = microTaskDebouncedCallback(() => callCount++)
    debouncedFn()
    debouncedFn()
    debouncedFn()
    Promise.resolve().then(() => {
      expect(callCount).toBe(1)
    })
  })
})
