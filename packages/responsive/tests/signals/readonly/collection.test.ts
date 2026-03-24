import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { isReadonly, RAW_VALUE, readonly } from '../../../src/index.js'
import { createReadonlyProxy } from '../../../src/signals/readonly/readonly.js'

describe('signal/readonly/collection', () => {
  describe('Map readonly', () => {
    it('should create a readonly Map proxy', () => {
      const map = new Map([
        ['key1', 'value1'],
        ['key2', 'value2']
      ])
      const readonlyMap = readonly(map)

      expect(isReadonly(readonlyMap)).toBe(true)
      expect(readonlyMap.size).toBe(2)
      expect(readonlyMap.get('key1')).toBe('value1')
      expect(readonlyMap.get('key2')).toBe('value2')
    })

    it('should allow reading operations', () => {
      const map = new Map([
        ['a', 1],
        ['b', 2]
      ])
      const readonlyMap = readonly(map)

      expect(readonlyMap.has('a')).toBe(true)
      expect(readonlyMap.has('c')).toBe(false)
      expect(readonlyMap.get('a')).toBe(1)
      expect(readonlyMap.get('c')).toBeUndefined()
      expect(readonlyMap.size).toBe(2)

      const keys = [...readonlyMap.keys()]
      expect(keys).toEqual(['a', 'b'])

      const values = [...readonlyMap.values()]
      expect(values).toEqual([1, 2])

      const entries = [...readonlyMap.entries()]
      expect(entries).toEqual([
        ['a', 1],
        ['b', 2]
      ])

      const forEachResult: Array<[string, number]> = []
      readonlyMap.forEach((value, key) => {
        forEachResult.push([key, value])
      })
      expect(forEachResult).toEqual([
        ['a', 1],
        ['b', 2]
      ])
    })

    it('should prevent set operation', () => {
      const map = new Map([['key', 'value']])
      const readonlyMap = readonly(map)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      const result = readonlyMap.set('newKey', 'newValue')

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The Map is read-only, and the set method cannot be called!'
      )
      expect(readonlyMap.has('newKey')).toBe(false)
      expect(result).toBe(readonlyMap)

      warnSpy.mockRestore()
    })

    it('should prevent delete operation', () => {
      const map = new Map([['key', 'value']])
      const readonlyMap = readonly(map)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      const result = readonlyMap.delete('key')

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The Map is read-only, and the delete method cannot be called!'
      )
      expect(readonlyMap.has('key')).toBe(true)
      expect(result).toBe(false)

      warnSpy.mockRestore()
    })

    it('should prevent clear operation', () => {
      const map = new Map([['key', 'value']])
      const readonlyMap = readonly(map)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      readonlyMap.clear()

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The Map is read-only, and the clear method cannot be called!'
      )
      expect(readonlyMap.size).toBe(1)

      warnSpy.mockRestore()
    })

    it('should return cached proxy for same Map', () => {
      const map = new Map([['key', 'value']])
      const readonlyMap1 = readonly(map)
      const readonlyMap2 = readonly(map)

      expect(readonlyMap1).toBe(readonlyMap2)
    })

    it('should return raw value via RAW_VALUE symbol', () => {
      const map = new Map([['key', 'value']])
      const readonlyMap = readonly(map)

      expect(readonlyMap[RAW_VALUE]).toBe(map)
    })
  })

  describe('Set readonly', () => {
    it('should create a readonly Set proxy', () => {
      const set = new Set([1, 2, 3])
      const readonlySet = readonly(set)

      expect(isReadonly(readonlySet)).toBe(true)
      expect(readonlySet.size).toBe(3)
      expect(readonlySet.has(1)).toBe(true)
      expect(readonlySet.has(4)).toBe(false)
    })

    it('should allow reading operations', () => {
      const set = new Set([1, 2, 3])
      const readonlySet = readonly(set)

      expect(readonlySet.has(1)).toBe(true)
      expect(readonlySet.has(4)).toBe(false)
      expect(readonlySet.size).toBe(3)

      const values = [...readonlySet.values()]
      expect(values).toEqual([1, 2, 3])

      const keys = [...readonlySet.keys()]
      expect(keys).toEqual([1, 2, 3])

      const entries = [...readonlySet.entries()]
      expect(entries).toEqual([
        [1, 1],
        [2, 2],
        [3, 3]
      ])

      const forEachResult: number[] = []
      readonlySet.forEach(value => {
        forEachResult.push(value)
      })
      expect(forEachResult).toEqual([1, 2, 3])
    })

    it('should prevent add operation', () => {
      const set = new Set([1, 2])
      const readonlySet = readonly(set)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      const result = readonlySet.add(3)

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The Set is read-only, and the add method cannot be called!'
      )
      expect(readonlySet.has(3)).toBe(false)
      expect(result).toBe(readonlySet)

      warnSpy.mockRestore()
    })

    it('should prevent delete operation', () => {
      const set = new Set([1, 2, 3])
      const readonlySet = readonly(set)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      const result = readonlySet.delete(1)

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The Set is read-only, and the delete method cannot be called!'
      )
      expect(readonlySet.has(1)).toBe(true)
      expect(result).toBe(false)

      warnSpy.mockRestore()
    })

    it('should prevent clear operation', () => {
      const set = new Set([1, 2, 3])
      const readonlySet = readonly(set)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      readonlySet.clear()

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The Set is read-only, and the clear method cannot be called!'
      )
      expect(readonlySet.size).toBe(3)

      warnSpy.mockRestore()
    })

    it('should return cached proxy for same Set', () => {
      const set = new Set([1, 2, 3])
      const readonlySet1 = readonly(set)
      const readonlySet2 = readonly(set)

      expect(readonlySet1).toBe(readonlySet2)
    })

    it('should return raw value via RAW_VALUE symbol', () => {
      const set = new Set([1, 2, 3])
      const readonlySet = readonly(set)

      expect(readonlySet[RAW_VALUE]).toBe(set)
    })
  })

  describe('WeakMap readonly', () => {
    it('should create a readonly WeakMap proxy', () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const weakMap = new WeakMap([
        [key1, 'value1'],
        [key2, 'value2']
      ])
      const readonlyWeakMap = readonly(weakMap)

      expect(isReadonly(readonlyWeakMap)).toBe(true)
      expect(readonlyWeakMap.get(key1)).toBe('value1')
      expect(readonlyWeakMap.get(key2)).toBe('value2')
    })

    it('should allow reading operations', () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const weakMap = new WeakMap([
        [key1, 'value1'],
        [key2, 'value2']
      ])
      const readonlyWeakMap = readonly(weakMap)

      expect(readonlyWeakMap.has(key1)).toBe(true)
      expect(readonlyWeakMap.has({ id: 3 })).toBe(false)
      expect(readonlyWeakMap.get(key1)).toBe('value1')
      expect(readonlyWeakMap.get({ id: 3 })).toBeUndefined()
    })

    it('should prevent set operation', () => {
      const key = { id: 1 }
      const weakMap = new WeakMap([[key, 'value']])
      const readonlyWeakMap = readonly(weakMap)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      const newKey = { id: 2 }
      const result = readonlyWeakMap.set(newKey, 'newValue')

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The Map is read-only, and the set method cannot be called!'
      )
      expect(readonlyWeakMap.has(newKey)).toBe(false)
      expect(result).toBe(readonlyWeakMap)

      warnSpy.mockRestore()
    })

    it('should prevent delete operation', () => {
      const key = { id: 1 }
      const weakMap = new WeakMap([[key, 'value']])
      const readonlyWeakMap = readonly(weakMap)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      const result = readonlyWeakMap.delete(key)

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The Map is read-only, and the delete method cannot be called!'
      )
      expect(readonlyWeakMap.has(key)).toBe(true)
      expect(result).toBe(false)

      warnSpy.mockRestore()
    })

    it('should return cached proxy for same WeakMap', () => {
      const key = { id: 1 }
      const weakMap = new WeakMap([[key, 'value']])
      const readonlyWeakMap1 = readonly(weakMap)
      const readonlyWeakMap2 = readonly(weakMap)

      expect(readonlyWeakMap1).toBe(readonlyWeakMap2)
    })

    it('should return raw value via RAW_VALUE symbol', () => {
      const key = { id: 1 }
      const weakMap = new WeakMap([[key, 'value']])
      const readonlyWeakMap = readonly(weakMap)

      expect(readonlyWeakMap[RAW_VALUE]).toBe(weakMap)
    })
  })

  describe('WeakSet readonly', () => {
    it('should create a readonly WeakSet proxy', () => {
      const item1 = { id: 1 }
      const item2 = { id: 2 }
      const weakSet = new WeakSet([item1, item2])
      const readonlyWeakSet = readonly(weakSet)

      expect(isReadonly(readonlyWeakSet)).toBe(true)
      expect(readonlyWeakSet.has(item1)).toBe(true)
      expect(readonlyWeakSet.has(item2)).toBe(true)
    })

    it('should allow reading operations', () => {
      const item1 = { id: 1 }
      const item2 = { id: 2 }
      const weakSet = new WeakSet([item1, item2])
      const readonlyWeakSet = readonly(weakSet)

      expect(readonlyWeakSet.has(item1)).toBe(true)
      expect(readonlyWeakSet.has(item2)).toBe(true)
      expect(readonlyWeakSet.has({ id: 3 })).toBe(false)
    })

    it('should prevent add operation', () => {
      const item = { id: 1 }
      const weakSet = new WeakSet([item])
      const readonlyWeakSet = readonly(weakSet)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      const newItem = { id: 2 }
      const result = readonlyWeakSet.add(newItem)

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The Set is read-only, and the add method cannot be called!'
      )
      expect(readonlyWeakSet.has(newItem)).toBe(false)
      expect(result).toBe(readonlyWeakSet)

      warnSpy.mockRestore()
    })

    it('should prevent delete operation', () => {
      const item = { id: 1 }
      const weakSet = new WeakSet([item])
      const readonlyWeakSet = readonly(weakSet)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      const result = readonlyWeakSet.delete(item)

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The Set is read-only, and the delete method cannot be called!'
      )
      expect(readonlyWeakSet.has(item)).toBe(true)
      expect(result).toBe(false)

      warnSpy.mockRestore()
    })

    it('should return cached proxy for same WeakSet', () => {
      const item = { id: 1 }
      const weakSet = new WeakSet([item])
      const readonlyWeakSet1 = readonly(weakSet)
      const readonlyWeakSet2 = readonly(weakSet)

      expect(readonlyWeakSet1).toBe(readonlyWeakSet2)
    })

    it('should return raw value via RAW_VALUE symbol', () => {
      const item = { id: 1 }
      const weakSet = new WeakSet([item])
      const readonlyWeakSet = readonly(weakSet)

      expect(readonlyWeakSet[RAW_VALUE]).toBe(weakSet)
    })
  })

  describe('createReadonlyProxy for collections', () => {
    it('should create readonly proxy for Map', () => {
      const map = new Map([['key', 'value']])
      const readonlyMap = createReadonlyProxy(map, true)

      expect(readonlyMap.get('key')).toBe('value')
      expect(isReadonly(readonlyMap)).toBe(true)
    })

    it('should create readonly proxy for Set', () => {
      const set = new Set([1, 2, 3])
      const readonlySet = createReadonlyProxy(set, true)

      expect(readonlySet.has(1)).toBe(true)
      expect(isReadonly(readonlySet)).toBe(true)
    })

    it('should create readonly proxy for WeakMap', () => {
      const key = { id: 1 }
      const weakMap = new WeakMap([[key, 'value']])
      const readonlyWeakMap = createReadonlyProxy(weakMap, true)

      expect(readonlyWeakMap.get(key)).toBe('value')
      expect(isReadonly(readonlyWeakMap)).toBe(true)
    })

    it('should create readonly proxy for WeakSet', () => {
      const item = { id: 1 }
      const weakSet = new WeakSet([item])
      const readonlyWeakSet = createReadonlyProxy(weakSet, true)

      expect(readonlyWeakSet.has(item)).toBe(true)
      expect(isReadonly(readonlyWeakSet)).toBe(true)
    })

    it('should use separate cache for collections', () => {
      const map = new Map([['key', 'value']])
      const readonlyMap1 = createReadonlyProxy(map, true)
      const readonlyMap2 = createReadonlyProxy(map, false)

      expect(readonlyMap1).toBe(readonlyMap2)
    })
  })

  describe('edge cases', () => {
    it('should handle empty Map', () => {
      const map = new Map()
      const readonlyMap = readonly(map)

      expect(readonlyMap.size).toBe(0)
      expect(readonlyMap.has('key')).toBe(false)
    })

    it('should handle empty Set', () => {
      const set = new Set()
      const readonlySet = readonly(set)

      expect(readonlySet.size).toBe(0)
      expect(readonlySet.has(1)).toBe(false)
    })

    it('should handle Map with various value types', () => {
      const map = new Map<string, unknown>([
        ['string', 'value'],
        ['number', 42],
        ['object', { nested: true }],
        ['array', [1, 2, 3]],
        ['null', null],
        ['undefined', undefined]
      ])
      const readonlyMap = readonly(map)

      expect(readonlyMap.get('string')).toBe('value')
      expect(readonlyMap.get('number')).toBe(42)
      expect(readonlyMap.get('object')).toEqual({ nested: true })
      expect(readonlyMap.get('array')).toEqual([1, 2, 3])
      expect(readonlyMap.get('null')).toBeNull()
      expect(readonlyMap.get('undefined')).toBeUndefined()
    })

    it('should handle Set with various value types', () => {
      const obj = { id: 1 }
      const arr = [1, 2, 3]
      const set = new Set([1, 'string', true, obj, arr, null, undefined])
      const readonlySet = readonly(set)

      expect(readonlySet.has(1)).toBe(true)
      expect(readonlySet.has('string')).toBe(true)
      expect(readonlySet.has(true)).toBe(true)
      expect(readonlySet.has(obj)).toBe(true)
      expect(readonlySet.has(arr)).toBe(true)
      expect(readonlySet.has(null)).toBe(true)
      expect(readonlySet.has(undefined)).toBe(true)
    })

    it('should handle property assignment on collection', () => {
      const map = new Map([['key', 'value']])
      const readonlyMap = readonly(map)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      ;(readonlyMap as unknown as Record<string, unknown>).customProp = 'value'

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The collection is read-only, and the customProp attribute cannot be set!'
      )

      warnSpy.mockRestore()
    })

    it('should handle property deletion on collection', () => {
      const map = new Map([['key', 'value']])
      const readonlyMap = readonly(map)
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      delete (readonlyMap as unknown as Record<string, unknown>).size

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The collection is read-only, and the size attribute cannot be removed!'
      )

      warnSpy.mockRestore()
    })
  })
})
