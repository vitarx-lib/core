import { describe, expect, it, vi } from 'vitest'
import { watch } from '../../../src/index.js'
import { MapReactive, WeakMapReactive } from '../../../src/signals/reactive/map.js'

describe('signal/reactive/map', () => {
  describe('ReactiveWeakMap', () => {
    it('should create a ReactiveWeakMap instance', () => {
      const target = new WeakMap()
      const reactiveWeakMap = new WeakMapReactive(target)

      expect(reactiveWeakMap).toBeInstanceOf(WeakMapReactive)
      expect(reactiveWeakMap.target).toBe(target)
    })

    it('should handle delete operations', () => {
      const key = {}
      const target = new WeakMap([[key, 'value']])
      const reactiveWeakMap = new WeakMapReactive(target)
      const triggerSignalSpy = vi.spyOn(reactiveWeakMap as any, 'triggerSignal')

      const result = reactiveWeakMap.proxy.delete(key)

      expect(result).toBe(true)
      expect(triggerSignalSpy).toHaveBeenCalledWith('delete', { key })
    })

    it('should handle set operations', () => {
      const key = {}
      const target = new WeakMap()
      const reactiveWeakMap = new WeakMapReactive(target)
      const triggerSignalSpy = vi.spyOn(reactiveWeakMap as any, 'triggerSignal')

      const result = reactiveWeakMap.proxy.set(key, 'value')

      expect(result).toBe(reactiveWeakMap.proxy)
      expect(triggerSignalSpy).toHaveBeenCalledWith('set', { key })
    })

    it('should not trigger signal when setting same value', () => {
      const key = {}
      const target = new WeakMap([[key, 'value']])
      const reactiveWeakMap = new WeakMapReactive(target)
      const triggerSignalSpy = vi.spyOn(reactiveWeakMap as any, 'triggerSignal')

      const result = reactiveWeakMap.proxy.set(key, 'value')

      expect(result).toBe(reactiveWeakMap.proxy)
      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })
  })

  describe('ReactiveMap', () => {
    it('should create a ReactiveMap instance', () => {
      const target = new Map()
      const reactiveMap = new MapReactive(target)

      expect(reactiveMap).toBeInstanceOf(MapReactive)
      expect(reactiveMap.target).toBe(target)
    })

    it('should handle clear operations', () => {
      const target = new Map([
        ['key1', 'value1'],
        ['key2', 'value2']
      ])
      const reactiveMap = new MapReactive(target)
      const triggerSignalSpy = vi.spyOn(reactiveMap as any, 'triggerSignal')

      reactiveMap.proxy.clear()

      expect(target.size).toBe(0)
      expect(triggerSignalSpy).toHaveBeenCalledWith('clear', {
        key: 'size',
        oldValue: 2,
        newValue: 0
      })
    })

    it('should not trigger signal when clearing empty map', () => {
      const target = new Map()
      const reactiveMap = new MapReactive(target)
      const triggerSignalSpy = vi.spyOn(reactiveMap as any, 'triggerSignal')

      reactiveMap.proxy.clear()

      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })
  })

  describe('regression: 集合依赖追踪', () => {
    it('set() 改变 has() 结果时应触发 watch 回调', () => {
      // 回归测试：集合读取未建立依赖关系导致 watch 不响应
      const reactiveMap = new MapReactive(new Map())
      const callback = vi.fn()

      const watcher = watch(() => reactiveMap.proxy.has('key'), callback, {
        flush: 'sync'
      })

      expect(callback).not.toHaveBeenCalled()

      reactiveMap.proxy.set('key', 'value')

      expect(callback).toHaveBeenCalledWith(true, false, expect.any(Function))

      watcher.dispose()
    })

    it('set() 改变 get() 结果时应触发 watch 回调', () => {
      const reactiveMap = new MapReactive(new Map())
      const callback = vi.fn()

      const watcher = watch(() => reactiveMap.proxy.get('key'), callback, {
        flush: 'sync'
      })

      reactiveMap.proxy.set('key', 'value')

      expect(callback).toHaveBeenCalledWith('value', undefined, expect.any(Function))

      watcher.dispose()
    })

    it('delete() 改变 has() 结果时应触发 watch 回调', () => {
      const reactiveMap = new MapReactive(new Map([['key', 'value']]))
      const callback = vi.fn()

      const watcher = watch(() => reactiveMap.proxy.has('key'), callback, {
        flush: 'sync'
      })

      reactiveMap.proxy.delete('key')

      expect(callback).toHaveBeenCalledWith(false, true, expect.any(Function))

      watcher.dispose()
    })
  })
})
