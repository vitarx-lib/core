import { describe, expect, it, vi } from 'vitest'
import { ReactiveWeakMap, ReactiveMap } from '../../../src/signal/reactive/map.js'

describe('signal/reactive/map', () => {
  describe('ReactiveWeakMap', () => {
    it('should create a ReactiveWeakMap instance', () => {
      const target = new WeakMap()
      const reactiveWeakMap = new ReactiveWeakMap(target)
      
      expect(reactiveWeakMap).toBeInstanceOf(ReactiveWeakMap)
      expect(reactiveWeakMap.target).toBe(target)
    })

    it('should handle delete operations', () => {
      const key = {}
      const target = new WeakMap([[key, 'value']])
      const reactiveWeakMap = new ReactiveWeakMap(target)
      const triggerSignalSpy = vi.spyOn(reactiveWeakMap as any, 'triggerSignal')
      
      const result = reactiveWeakMap.proxy.delete(key)
      
      expect(result).toBe(true)
      expect(triggerSignalSpy).toHaveBeenCalledWith('delete', { key })
    })

    it('should handle set operations', () => {
      const key = {}
      const target = new WeakMap()
      const reactiveWeakMap = new ReactiveWeakMap(target)
      const triggerSignalSpy = vi.spyOn(reactiveWeakMap as any, 'triggerSignal')
      
      const result = reactiveWeakMap.proxy.set(key, 'value')
      
      expect(result).toBe(reactiveWeakMap.proxy)
      expect(triggerSignalSpy).toHaveBeenCalledWith('set', { key })
    })

    it('should not trigger signal when setting same value', () => {
      const key = {}
      const target = new WeakMap([[key, 'value']])
      const reactiveWeakMap = new ReactiveWeakMap(target)
      const triggerSignalSpy = vi.spyOn(reactiveWeakMap as any, 'triggerSignal')
      
      const result = reactiveWeakMap.proxy.set(key, 'value')
      
      expect(result).toBe(reactiveWeakMap.proxy)
      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })
  })

  describe('ReactiveMap', () => {
    it('should create a ReactiveMap instance', () => {
      const target = new Map()
      const reactiveMap = new ReactiveMap(target)
      
      expect(reactiveMap).toBeInstanceOf(ReactiveMap)
      expect(reactiveMap.target).toBe(target)
    })

    it('should handle clear operations', () => {
      const target = new Map([['key1', 'value1'], ['key2', 'value2']])
      const reactiveMap = new ReactiveMap(target)
      const triggerSignalSpy = vi.spyOn(reactiveMap as any, 'triggerSignal')
      
      reactiveMap.proxy.clear()
      
      expect(target.size).toBe(0)
      expect(triggerSignalSpy).toHaveBeenCalledWith('clear', { key: 'size', oldValue: 2, newValue: 0 })
    })

    it('should not trigger signal when clearing empty map', () => {
      const target = new Map()
      const reactiveMap = new ReactiveMap(target)
      const triggerSignalSpy = vi.spyOn(reactiveMap as any, 'triggerSignal')
      
      reactiveMap.proxy.clear()
      
      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })
  })
})