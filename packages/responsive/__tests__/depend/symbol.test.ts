import { describe, expect, it } from 'vitest'
import { 
  EFFECT_DEP_HEAD, 
  EFFECT_DEP_TAIL, 
  SIGNAL_DEP_HEAD, 
  SIGNAL_DEP_TAIL,
  DEP_VERSION,
  DEP_INDEX_MAP
} from '../../src/depend/symbol.js'

describe('depend/symbol', () => {
  describe('EFFECT_DEP_HEAD', () => {
    it('should be a Symbol', () => {
      expect(typeof EFFECT_DEP_HEAD).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(EFFECT_DEP_HEAD.toString()).toBe('Symbol(__v_dep:effect_dep_head)')
    })
  })

  describe('EFFECT_DEP_TAIL', () => {
    it('should be a Symbol', () => {
      expect(typeof EFFECT_DEP_TAIL).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(EFFECT_DEP_TAIL.toString()).toBe('Symbol(__v_dep:effect_dep_tail)')
    })
  })

  describe('SIGNAL_DEP_HEAD', () => {
    it('should be a Symbol', () => {
      expect(typeof SIGNAL_DEP_HEAD).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(SIGNAL_DEP_HEAD.toString()).toBe('Symbol(__v_dep:signal_dep_head)')
    })
  })

  describe('SIGNAL_DEP_TAIL', () => {
    it('should be a Symbol', () => {
      expect(typeof SIGNAL_DEP_TAIL).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(SIGNAL_DEP_TAIL.toString()).toBe('Symbol(__v_dep:signal_dep_tail)')
    })
  })

  describe('DEP_VERSION', () => {
    it('should be a Symbol', () => {
      expect(typeof DEP_VERSION).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(DEP_VERSION.toString()).toBe('Symbol(__v_dep:version)')
    })
  })

  describe('DEP_INDEX_MAP', () => {
    it('should be a Symbol', () => {
      expect(typeof DEP_INDEX_MAP).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(DEP_INDEX_MAP.toString()).toBe('Symbol(__v_dep:index_map)')
    })
  })
})