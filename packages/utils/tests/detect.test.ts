import { describe, expect, it } from 'vitest'
import {
  isArray,
  isAsyncFunction,
  isBool,
  isCollection,
  isDeepEqual,
  isEmpty,
  isFunction,
  isMap,
  isNumber,
  isNumString,
  isObject,
  isPlainObject,
  isPromise,
  isSet,
  isString,
  isWeakMap,
  isWeakSet
} from '../src/detect.js'

describe('detect', () => {
  it('should detect objects correctly', () => {
    expect(isObject({})).toBe(true)
    expect(isObject(null)).toBe(false)
    expect(isObject(undefined)).toBe(false)
    expect(isObject([])).toBe(true)
    expect(isObject(123)).toBe(false)
  })

  it('should detect record objects correctly', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject(new Map())).toBe(false)
  })

  it('should detect arrays correctly', () => {
    expect(isArray([])).toBe(true)
    expect(isArray({})).toBe(false)
    expect(isArray('array')).toBe(false)
  })

  it('should detect strings correctly', () => {
    expect(isString('')).toBe(true)
    expect(isString(123)).toBe(false)
    expect(isString(null)).toBe(false)
  })

  it('should detect numbers correctly', () => {
    expect(isNumber(0)).toBe(true)
    expect(isNumber('123')).toBe(false)
    expect(isNumber(NaN)).toBe(true)
  })

  it('should detect booleans correctly', () => {
    expect(isBool(true)).toBe(true)
    expect(isBool(false)).toBe(true)
    expect(isBool(0)).toBe(false)
  })

  it('should detect empty values correctly', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty('')).toBe(true)
    expect(isEmpty([])).toBe(true)
    expect(isEmpty({})).toBe(true)
    expect(isEmpty({ key: 'value' })).toBe(false)
  })

  it('should detect async functions correctly', () => {
    expect(isAsyncFunction(async () => {})).toBe(true)
    expect(isAsyncFunction(() => {})).toBe(false)
  })

  it('should detect functions correctly', () => {
    expect(isFunction(() => {})).toBe(true)
    expect(isFunction('')).toBe(false)
  })

  it('should detect numeric strings correctly', () => {
    expect(isNumString('123')).toBe(true)
    expect(isNumString('abc')).toBe(false)
    expect(isNumString('123 ')).toBe(false)
    expect(isNumString('123 ', true)).toBe(true)
  })

  it('should detect Map objects correctly', () => {
    expect(isMap(new Map())).toBe(true)
    expect(isMap({})).toBe(false)
  })

  it('should detect Set objects correctly', () => {
    expect(isSet(new Set())).toBe(true)
    expect(isSet([])).toBe(false)
  })

  it('should detect WeakMap objects correctly', () => {
    expect(isWeakMap(new WeakMap())).toBe(true)
    expect(isWeakMap(new Map())).toBe(false)
  })

  it('should detect WeakSet objects correctly', () => {
    expect(isWeakSet(new WeakSet())).toBe(true)
    expect(isWeakSet(new Set())).toBe(false)
  })

  it('should detect collection objects correctly', () => {
    expect(isCollection(new Map())).toBe(true)
    expect(isCollection(new Set())).toBe(true)
    expect(isCollection({})).toBe(false)
  })

  it('should perform deep equality correctly', () => {
    expect(isDeepEqual({ a: 1 }, { a: 1 })).toBe(true)
    expect(isDeepEqual({ a: 1 }, { a: 2 })).toBe(false)
    expect(isDeepEqual([1], [1])).toBe(true)
    expect(isDeepEqual([1], [2])).toBe(false)
  })

  it('should detect Promise objects correctly', () => {
    expect(isPromise(Promise.resolve())).toBe(true)
    expect(
      isPromise({
        then: () => {}
      })
    ).toBe(false)
  })
})
