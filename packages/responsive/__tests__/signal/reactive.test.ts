import { describe, expect, it, vi } from 'vitest'
import { reactive, watch } from '../../src/index.js'

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
})
