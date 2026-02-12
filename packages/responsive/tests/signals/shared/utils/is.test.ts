import { describe, expect, it } from 'vitest'
import {
  computed,
  isReactive,
  isReadonly,
  isRef,
  isRefSignal,
  reactive,
  readonly,
  ref
} from '../../../../src/index.js'

describe('utils/is', () => {
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
