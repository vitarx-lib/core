import { describe, expect, it, vi } from 'vitest'
import { ref } from '../../../src/index.js'
import {
  ArrayReactive,
  createReactive,
  ObjectReactive,
  ReactiveProperty
} from '../../../src/signals/reactive/object.js'

describe('signal/reactive/object', () => {
  describe('PropertySignal', () => {
    it('should create a PropertySignal instance', () => {
      const target = { prop: 42 }
      const propertySignal = new ReactiveProperty(target, 'prop', true)

      expect(propertySignal).toBeInstanceOf(ReactiveProperty)
      expect(propertySignal.target).toBe(target)
      expect(propertySignal.key).toBe('prop')
      expect(propertySignal.deep).toBe(true)
    })

    it('should get value and track dependencies', async () => {
      const target = { prop: 42 }
      const propertySignal = new ReactiveProperty(target, 'prop', true)
      const trackSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'trackSignal'
      )

      const value = propertySignal.getValue()

      expect(value).toBe(42)
      expect(trackSignalSpy).toHaveBeenCalledWith(propertySignal)
    })

    it('should set value and trigger updates', async () => {
      const target = { prop: 0 }
      const propertySignal = new ReactiveProperty(target, 'prop', true)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'triggerSignal'
      )

      propertySignal.setValue(42)

      expect(target.prop).toBe(42)
      expect(triggerSignalSpy).toHaveBeenCalledWith(propertySignal, 'set', { newValue: 42 })
    })

    it('should invalidate and clear effects', async () => {
      const target = { prop: 42 }
      const propertySignal = new ReactiveProperty(target, 'prop', true)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'triggerSignal'
      )
      const clearSignalEffectsSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'clearSignalEffects'
      )

      propertySignal.invalidate(42)

      expect(triggerSignalSpy).toHaveBeenCalledWith(propertySignal, 'set', {
        oldValue: 42,
        newValue: undefined
      })
      expect(clearSignalEffectsSpy).toHaveBeenCalledWith(propertySignal)
      expect(propertySignal['proxy']).toBeUndefined()
    })

    it('should unwrap ref values', () => {
      const refValue = ref(42)
      const target = { prop: refValue }
      const propertySignal = new ReactiveProperty(target, 'prop', true)

      const value = propertySignal.getValue()

      expect(value).toBe(42)
    })

    it('should unwrap callable signal values', () => {
      const callableSignal = ref(42)
      const target = { prop: callableSignal }
      const propertySignal = new ReactiveProperty(target, 'prop', true)

      const value = propertySignal.getValue()

      expect(value).toBe(42)
    })
  })

  describe('ReactiveObject', () => {
    it('should create a ReactiveObject instance', () => {
      const target = { prop: 42 }
      const reactiveObject = new ObjectReactive(target, true)

      expect(reactiveObject).toBeInstanceOf(ObjectReactive)
      expect(reactiveObject['target']).toBe(target)
      expect(reactiveObject['deep']).toBe(true)
    })

    it('should check if property exists', () => {
      const target = { prop: 42 }
      const reactiveObject = new ObjectReactive(target, true)
      const trackSignalSpy = vi.spyOn(reactiveObject as any, 'trackSignal')

      const result = reactiveObject.has(target, 'prop')

      expect(result).toBe(true)
      expect(trackSignalSpy).toHaveBeenCalledWith('has', { key: 'prop' })
    })

    it('should delete property', () => {
      const target = { prop: 42 }
      const reactiveObject = new ObjectReactive(target, true)
      const triggerSignalSpy = vi.spyOn(reactiveObject as any, 'triggerSignal')

      const result = reactiveObject.deleteProperty(target, 'prop')

      expect(result).toBe(true)
      expect(triggerSignalSpy).toHaveBeenCalledWith('deleteProperty', {
        key: 'prop',
        oldValue: 42,
        newValue: undefined
      })
    })

    it('should get property value', () => {
      const target = { prop: 42 }
      const reactiveObject = new ObjectReactive(target, true)

      // Mock the receiver to avoid issues with Proxy
      const receiver = {}
      const value = (reactiveObject as any).doGet(target, 'prop', receiver)

      expect(value).toBe(42)
    })

    it('should set property value', () => {
      const target = { prop: 0 } as any
      const reactiveObject = new ObjectReactive(target, true)

      const result = (reactiveObject as any).set(target, 'prop', 42, {})

      expect(result).toBe(true)
      expect(target.prop).toBe(42)
    })
  })

  describe('ReactiveArray', () => {
    it('should create a ReactiveArray instance', () => {
      const target = [1, 2, 3]
      const reactiveArray = new ArrayReactive(target, true)

      expect(reactiveArray).toBeInstanceOf(ArrayReactive)
      expect(reactiveArray['target']).toBe(target)
      expect(reactiveArray['deep']).toBe(true)
    })

    it('should handle array length changes', async () => {
      const target = [1, 2, 3]
      const reactiveArray = new ArrayReactive(target, true)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'triggerSignal'
      )

      // Mock the receiver to avoid issues with Proxy
      const result = (reactiveArray as any).set(target, 'length', 2, {})

      expect(result).toBe(true)
      expect(target.length).toBe(2)
      expect(triggerSignalSpy).toHaveBeenCalled()
    })

    it('should throw error for invalid array length', () => {
      const target = [1, 2, 3]
      const reactiveArray = new ArrayReactive(target, true)

      expect(() => {
        ;(reactiveArray as any).set(target, 'length', -1, {})
      }).toThrow('Invalid array length: -1')
    })
  })

  describe('createReactive', () => {
    it('should create reactive object', () => {
      const target = { prop: 42 }
      const reactive = createReactive(target)

      expect(reactive).toBeDefined()
      expect(reactive.prop).toBe(42)
    })

    it('should create reactive array', () => {
      const target = [1, 2, 3]
      const reactive = createReactive(target)

      expect(reactive).toBeDefined()
      expect(Array.isArray(reactive)).toBe(true)
      expect(reactive.length).toBe(3)
    })

    it('should create reactive Map', () => {
      const target = new Map([['key', 'value']])
      const reactive = createReactive(target)

      expect(reactive).toBeDefined()
      expect(reactive.get('key')).toBe('value')
    })

    it('should create reactive Set', () => {
      const target = new Set([1, 2, 3])
      const reactive = createReactive(target)

      expect(reactive).toBeDefined()
      expect(reactive.has(1)).toBe(true)
    })

    it('should create reactive WeakMap', () => {
      const key = {}
      const target = new WeakMap([[key, 'value']])
      const reactive = createReactive(target)

      expect(reactive).toBeDefined()
      expect(reactive.get(key)).toBe('value')
    })

    it('should create reactive WeakSet', () => {
      const key = {}
      const target = new WeakSet([key])
      const reactive = createReactive(target)

      expect(reactive).toBeDefined()
      expect(reactive.has(key)).toBe(true)
    })
  })
})
