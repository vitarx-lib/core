import { describe, expect, it } from 'vitest'
import { 
  PREV_EFFECT, 
  NEXT_EFFECT, 
  OWNER_SCOPE, 
  ACTIVE_SCOPE 
} from '../../src/effect/symbol.js'

describe('effect/symbol', () => {
  describe('PREV_EFFECT', () => {
    it('should be a Symbol', () => {
      expect(typeof PREV_EFFECT).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(PREV_EFFECT.toString()).toBe('Symbol(__v_effect:prev)')
    })
  })

  describe('NEXT_EFFECT', () => {
    it('should be a Symbol', () => {
      expect(typeof NEXT_EFFECT).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(NEXT_EFFECT.toString()).toBe('Symbol(__v_effect:next)')
    })
  })

  describe('OWNER_SCOPE', () => {
    it('should be a Symbol', () => {
      expect(typeof OWNER_SCOPE).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(OWNER_SCOPE.toString()).toBe('Symbol(__v_effect:owner_scope)')
    })
  })

  describe('ACTIVE_SCOPE', () => {
    it('should be a Symbol', () => {
      expect(typeof ACTIVE_SCOPE).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(ACTIVE_SCOPE.toString()).toBe('Symbol(__v_effect:active_context)')
    })
  })
})