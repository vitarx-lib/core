import { describe, expect, it } from 'vitest'
import { deepClone } from '../src/clone'

describe('deepClone', () => {
  // 测试基本数据类型
  it('should clone primitive values', () => {
    expect(deepClone(null)).toBe(null)
    expect(deepClone(undefined)).toBe(undefined)
    expect(deepClone(123)).toBe(123)
    expect(deepClone('test')).toBe('test')
    expect(deepClone(true)).toBe(true)
    expect(deepClone(false)).toBe(false)
    const symbol = Symbol('test')
    expect(deepClone(symbol)).toEqual(symbol)
  })

  // 测试数组克隆
  it('should clone arrays', () => {
    const arr = [1, 'test', { a: 1 }, [2, 3]]
    const cloned = deepClone(arr)
    expect(cloned).toEqual(arr)
    expect(cloned).not.toBe(arr)
    expect(cloned[2]).not.toBe(arr[2])
    expect(cloned[3]).not.toBe(arr[3])
  })

  // 测试对象克隆
  it('should clone objects', () => {
    const obj = { a: 1, b: 'test', c: { d: 2 }, e: [1, 2, 3] }
    const cloned = deepClone(obj)
    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
    expect(cloned.c).not.toBe(obj.c)
    expect(cloned.e).not.toBe(obj.e)
  })

  // 测试循环引用
  it('should handle circular references', () => {
    const obj: any = { a: 1 }
    obj.self = obj
    const cloned = deepClone(obj)
    expect(cloned.a).toBe(1)
    expect(cloned.self).toBe(cloned)
  })

  // 测试内置对象
  it('should clone built-in objects', () => {
    // Date
    const date = new Date()
    const clonedDate = deepClone(date)
    expect(clonedDate).toEqual(date)
    expect(clonedDate).not.toBe(date)

    // RegExp
    const regex = /test/gi
    const clonedRegex = deepClone(regex)
    expect(clonedRegex).toEqual(regex)
    expect(clonedRegex).not.toBe(regex)

    // Set
    const set = new Set([1, 2, { a: 3 }])
    const clonedSet = deepClone(set)
    expect(clonedSet).toEqual(set)
    expect(clonedSet).not.toBe(set)
    expect(Array.from(clonedSet)[2]).not.toBe(Array.from(set)[2])

    // Map
    const map = new Map<string, string | { a: number }>([
      ['key1', 'value1'],
      ['key2', { a: 1 }]
    ])
    const clonedMap = deepClone(map)
    expect(clonedMap).toEqual(map)
    expect(clonedMap).not.toBe(map)
    expect(clonedMap.get('key2')).not.toBe(map.get('key2'))
  })

  // 测试Symbol类型的key
  it('should clone objects with Symbol keys', () => {
    const sym = Symbol('test')
    const obj = { [sym]: 'value' }
    const cloned = deepClone(obj)
    expect(cloned[sym]).toBe('value')
  })

  // 测试原型链
  it('should preserve prototype chain', () => {
    class TestClass {
      prop = 'test'
    }

    const instance = new TestClass()
    const cloned = deepClone(instance)
    expect(cloned instanceof TestClass).toBe(true)
    expect(cloned.prop).toBe('test')
  })
})
