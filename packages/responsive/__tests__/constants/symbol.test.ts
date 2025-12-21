import { describe, expect, it } from 'vitest'
import { IS_RAW, IS_REACTIVE, IS_REF, IS_SIGNAL, READONLY_SYMBOL } from '../../src/index.js'

describe('constants/symbol', () => {
  describe('IS_SIGNAL', () => {
    it('should be a Symbol', () => {
      expect(typeof IS_SIGNAL).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(IS_SIGNAL.toString()).toBe('Symbol(__v_signal:is-signal)')
    })
  })

  describe('READONLY_SYMBOL', () => {
    it('should be a Symbol', () => {
      expect(typeof READONLY_SYMBOL).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(READONLY_SYMBOL.toString()).toBe('Symbol(__v_symbol:is-readonly)')
    })
  })

  describe('IS_REF', () => {
    it('should be a Symbol', () => {
      expect(typeof IS_REF).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(IS_REF.toString()).toBe('Symbol(__v_symbol:is-ref)')
    })
  })

  describe('IS_REACTIVE', () => {
    it('should be a Symbol', () => {
      expect(typeof IS_REACTIVE).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(IS_REACTIVE.toString()).toBe('Symbol(__v_symbol:is-reactive)')
    })
  })

  describe('IS_RAW', () => {
    it('should be a Symbol', () => {
      expect(typeof IS_RAW).toBe('symbol')
    })

    it('should have correct description', () => {
      expect(IS_RAW.toString()).toBe('Symbol(__v_symbol:is-raw)')
    })
  })
})
