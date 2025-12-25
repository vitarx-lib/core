import { describe, expect, it, vi } from 'vitest'
import { collectionClear, ReactiveCollection } from '../../../src/signals/reactive/collection.js'

class TestReactiveCollection<T extends Map<any, any> | Set<any>> extends ReactiveCollection<T> {
  constructor(target: T) {
    super(target)
  }
}

describe('signal/reactive/collection', () => {
  describe('ReactiveCollection', () => {
    it('should create a ReactiveCollection instance', () => {
      const target = new Map()
      const reactiveCollection = new TestReactiveCollection(target)

      expect(reactiveCollection).toBeInstanceOf(ReactiveCollection)
      expect(reactiveCollection.target).toBe(target)
      expect(reactiveCollection.deep).toBe(false)
    })
  })

  describe('collectionClear', () => {
    it('should create a clear function for collections', () => {
      const target = new Map([
        ['key1', 'value1'],
        ['key2', 'value2']
      ])
      const reactiveCollection = new TestReactiveCollection(target)
      const clearFn = collectionClear(reactiveCollection)
      const triggerSignalSpy = vi.spyOn(reactiveCollection as any, 'triggerSignal')

      clearFn()

      expect(target.size).toBe(0)
      expect(triggerSignalSpy).toHaveBeenCalledWith('clear', {
        key: 'size',
        oldValue: 2,
        newValue: 0
      })
    })

    it('should not trigger signal when collection is already empty', () => {
      const target = new Map()
      const reactiveCollection = new TestReactiveCollection(target)
      const clearFn = collectionClear(reactiveCollection)
      const triggerSignalSpy = vi.spyOn(reactiveCollection as any, 'triggerSignal')

      clearFn()

      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })
  })
})
