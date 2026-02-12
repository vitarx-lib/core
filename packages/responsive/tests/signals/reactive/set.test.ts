import { describe, expect, it, vi } from 'vitest'
import { SetReactive, WeakSetReactive } from '../../../src/signals/reactive/set.js'

describe('signal/reactive/set', () => {
  describe('ReactiveWeakSet', () => {
    it('should create a ReactiveWeakSet instance', () => {
      const target = new WeakSet()
      const reactiveWeakSet = new WeakSetReactive(target)

      expect(reactiveWeakSet).toBeInstanceOf(WeakSetReactive)
      expect(reactiveWeakSet.target).toBe(target)
    })

    it('should handle add operations', () => {
      const item = {}
      const target = new WeakSet()
      const reactiveWeakSet = new WeakSetReactive(target)
      const triggerSignalSpy = vi.spyOn(reactiveWeakSet as any, 'triggerSignal')

      const result = reactiveWeakSet.proxy.add(item)

      expect(result).toBe(reactiveWeakSet.proxy)
      expect(triggerSignalSpy).toHaveBeenCalledWith('add')
    })

    it('should not trigger signal when adding existing item', () => {
      const item = {}
      const target = new WeakSet([item])
      const reactiveWeakSet = new WeakSetReactive(target)
      const triggerSignalSpy = vi.spyOn(reactiveWeakSet as any, 'triggerSignal')

      const result = reactiveWeakSet.proxy.add(item)

      expect(result).toBe(reactiveWeakSet.proxy)
      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })

    it('should handle delete operations', () => {
      const item = {}
      const target = new WeakSet([item])
      const reactiveWeakSet = new WeakSetReactive(target)
      const triggerSignalSpy = vi.spyOn(reactiveWeakSet as any, 'triggerSignal')

      const result = reactiveWeakSet.proxy.delete(item)

      expect(result).toBe(true)
      expect(triggerSignalSpy).toHaveBeenCalledWith('delete')
    })

    it('should not trigger signal when deleting non-existing item', () => {
      const item = {}
      const target = new WeakSet()
      const reactiveWeakSet = new WeakSetReactive(target)
      const triggerSignalSpy = vi.spyOn(reactiveWeakSet as any, 'triggerSignal')

      const result = reactiveWeakSet.proxy.delete(item)

      expect(result).toBe(false)
      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })
  })

  describe('ReactiveSet', () => {
    it('should create a ReactiveSet instance', () => {
      const target = new Set()
      const reactiveSet = new SetReactive(target)

      expect(reactiveSet).toBeInstanceOf(SetReactive)
      expect(reactiveSet.target).toBe(target)
    })

    it('should handle clear operations', () => {
      const target = new Set([1, 2, 3])
      const reactiveSet = new SetReactive(target)
      const triggerSignalSpy = vi.spyOn(reactiveSet as any, 'triggerSignal')

      reactiveSet.proxy.clear()

      expect(target.size).toBe(0)
      expect(triggerSignalSpy).toHaveBeenCalledWith('clear', {
        key: 'size',
        oldValue: 3,
        newValue: 0
      })
    })

    it('should not trigger signal when clearing empty set', () => {
      const target = new Set()
      const reactiveSet = new SetReactive(target)
      const triggerSignalSpy = vi.spyOn(reactiveSet as any, 'triggerSignal')

      reactiveSet.proxy.clear()

      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })
  })
})
