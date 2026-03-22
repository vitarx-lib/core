import { describe, expect, it, vi } from 'vitest'
import { reactive, shallowReactive, watch } from '../../src/index.js'

describe('signal/reactive', () => {
  it('should create a reactive object', () => {
    const obj = { count: 0 }
    const reactiveObj = reactive(obj)

    expect(reactiveObj).not.toBe(obj)
    expect(reactiveObj.count).toBe(0)
  })

  it('should reflect changes in the original object', () => {
    const obj = { count: 0 }
    const reactiveObj = reactive(obj)

    obj.count = 42
    expect(reactiveObj.count).toBe(42)
  })

  it('should reflect changes in the reactive object', () => {
    const obj = { count: 0 }
    const reactiveObj = reactive(obj)

    reactiveObj.count = 42
    expect(obj.count).toBe(42)
  })

  it('should trigger watchers when property changes', async () => {
    const obj = { count: 0 }
    const reactiveObj = reactive(obj)

    const callback = vi.fn()
    const watcher = watch(() => reactiveObj.count, callback, {
      flush: 'sync'
    })

    reactiveObj.count = 42
    expect(reactiveObj.count).toBe(42)

    // Callback should be called with new and old values
    expect(callback).toHaveBeenCalledWith(42, 0, expect.any(Function))

    watcher.dispose()
  })

  it('should work with nested objects', () => {
    const obj = { nested: { count: 0 } }
    const reactiveObj = reactive(obj)

    expect(reactiveObj.nested.count).toBe(0)

    reactiveObj.nested.count = 42
    expect(reactiveObj.nested.count).toBe(42)
  })

  it('should work with arrays', () => {
    const arr = [1, 2, 3]
    const reactiveArr = reactive(arr)

    expect(reactiveArr[0]).toBe(1)

    reactiveArr[0] = 42
    expect(reactiveArr[0]).toBe(42)
  })

  it('should handle adding new properties', () => {
    const obj: any = { count: 0 }
    const reactiveObj = reactive(obj)

    reactiveObj.newProp = 'new value'
    expect(reactiveObj.newProp).toBe('new value')
  })

  it('should handle deleting properties', () => {
    const obj: any = { count: 0, toDelete: 'value' }
    const reactiveObj = reactive(obj)

    expect(reactiveObj.toDelete).toBe('value')

    delete reactiveObj.toDelete
    expect(reactiveObj.toDelete).toBeUndefined()
  })

  describe('edge cases: nested collections', () => {
    it('should handle Set methods with correct this binding', () => {
      const obj = { set: new Set([1, 2, 3]) }
      const reactiveObj = reactive(obj)

      expect(reactiveObj.set.has(1)).toBe(true)
      expect(reactiveObj.set.has(4)).toBe(false)
      expect(reactiveObj.set.size).toBe(3)

      const values = [...reactiveObj.set.values()]
      expect(values).toEqual([1, 2, 3])

      const keys = [...reactiveObj.set.keys()]
      expect(keys).toEqual([1, 2, 3])

      const entries = [...reactiveObj.set.entries()]
      expect(entries).toEqual([
        [1, 1],
        [2, 2],
        [3, 3]
      ])

      reactiveObj.set.forEach(value => {
        expect([1, 2, 3]).toContain(value)
      })
    })

    it('should handle Map methods with correct this binding', () => {
      const obj = {
        map: new Map([
          ['a', 1],
          ['b', 2]
        ])
      }
      const reactiveObj = reactive(obj)

      expect(reactiveObj.map.size).toBe(2)
      expect(reactiveObj.map.has('a')).toBe(true)
      expect(reactiveObj.map.get('a')).toBe(1)
      expect(reactiveObj.map.get('c')).toBeUndefined()

      const keys = [...reactiveObj.map.keys()]
      expect(keys).toEqual(['a', 'b'])

      const values = [...reactiveObj.map.values()]
      expect(values).toEqual([1, 2])

      const entries = [...reactiveObj.map.entries()]
      expect(entries).toEqual([
        ['a', 1],
        ['b', 2]
      ])
    })

    it('should handle WeakSet methods with correct this binding', () => {
      const item1 = { id: 1 }
      const item2 = { id: 2 }
      const obj = { weakSet: new WeakSet([item1, item2]) }
      const reactiveObj = reactive(obj)

      expect(reactiveObj.weakSet.has(item1)).toBe(true)
      expect(reactiveObj.weakSet.has(item2)).toBe(true)
      expect(reactiveObj.weakSet.has({ id: 3 })).toBe(false)
    })

    it('should handle WeakMap methods with correct this binding', () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const obj = {
        weakMap: new WeakMap([
          [key1, 'value1'],
          [key2, 'value2']
        ])
      }
      const reactiveObj = reactive(obj)

      expect(reactiveObj.weakMap.has(key1)).toBe(true)
      expect(reactiveObj.weakMap.get(key1)).toBe('value1')
      expect(reactiveObj.weakMap.get(key2)).toBe('value2')
      expect(reactiveObj.weakMap.get({ id: 3 })).toBeUndefined()
    })

    it('should handle nested Set in shallowReactive', () => {
      const obj = { set: new Set([1, 2, 3]), nested: { value: 1 } }
      const shallowReactiveObj = shallowReactive(obj)

      expect(shallowReactiveObj.set.size).toBe(3)
      expect(shallowReactiveObj.set.has(1)).toBe(true)

      expect(shallowReactiveObj.nested.value).toBe(1)
      shallowReactiveObj.nested.value = 42
      expect(shallowReactiveObj.nested.value).toBe(42)
    })

    it('should handle nested Map in shallowReactive', () => {
      const obj = { map: new Map([['a', 1]]), nested: { value: 1 } }
      const shallowReactiveObj = shallowReactive(obj)

      expect(shallowReactiveObj.map.size).toBe(1)
      expect(shallowReactiveObj.map.get('a')).toBe(1)

      expect(shallowReactiveObj.nested.value).toBe(1)
      shallowReactiveObj.nested.value = 42
      expect(shallowReactiveObj.nested.value).toBe(42)
    })
  })
})
