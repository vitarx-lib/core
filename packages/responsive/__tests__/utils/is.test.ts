import { describe, expect, it } from 'vitest'
import { computed, reactive, readonly, ref, signal } from '../../src/index.js'
import {
  isCallableSignal,
  isReactive,
  isReadonly,
  isRef,
  isRefSignal,
  isSignal
} from '../../src/utils/is.js'

describe('utils/is', () => {
  describe('isSignal', () => {
    it('should return true for signals', () => {
      const signal = ref(42)
      expect(isSignal(signal)).toBe(true)
    })

    it('should return false for non-signals', () => {
      expect(isSignal(42)).toBe(false)
      expect(isSignal({})).toBe(false)
      expect(isSignal(null)).toBe(false)
      expect(isSignal(undefined)).toBe(false)
    })
  })

  describe('isCallableSignal', () => {
    it('should return true for callable signals', () => {
      const sig = signal(42)
      expect(isCallableSignal(sig)).toBe(true)
    })

    it('should return false for non-callable values', () => {
      expect(isCallableSignal(42)).toBe(false)
      expect(isCallableSignal({})).toBe(false)
      expect(isCallableSignal(null)).toBe(false)
    })
  })

  describe('isRefSignal', () => {
    it('should return true for ref signals', () => {
      const refSignal = ref(42)
      expect(isRefSignal(refSignal)).toBe(true)
    })

    it('should return false for non-ref signals', () => {
      const callableSignal = computed(() => 42)
      expect(isRefSignal(callableSignal)).toBe(true)
      expect(isRefSignal(42)).toBe(false)
    })
  })

  describe('isRef', () => {
    it('should return true for ref wrappers', () => {
      const refInstance = ref(42)
      expect(isRef(refInstance)).toBe(true)

      const computedInstance = computed(() => 42)
      expect(isRef(computedInstance)).toBe(true)
    })

    it('should return false for non-ref values', () => {
      expect(isRef(42)).toBe(false)
      expect(isRef({})).toBe(false)
      expect(isRef(null)).toBe(false)
    })
  })

  describe('isReactive', () => {
    it('should return true for reactive objects', () => {
      const reactiveObj = reactive({ count: 0 })
      expect(isReactive(reactiveObj)).toBe(true)
    })

    it('should return false for non-reactive values', () => {
      expect(isReactive(42)).toBe(false)
      expect(isReactive({})).toBe(false)
      expect(isReactive(null)).toBe(false)
    })
  })

  describe('isReadonly', () => {
    it('should return true for readonly objects', () => {
      const readonlyObj = readonly({ count: 0 })
      expect(isReadonly(readonlyObj)).toBe(true)
    })

    it('should return false for non-readonly values', () => {
      expect(isReadonly(42)).toBe(false)
      expect(isReadonly({})).toBe(false)
      expect(isReadonly(null)).toBe(false)
    })
  })
})
