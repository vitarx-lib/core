import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { triggerOnTrack, triggerOnTrigger } from '../../../src/core/signal/debug.js'

describe('depend/debug', () => {
  describe('triggerOnTrack', () => {
    it('should call onTrack handler when it exists and is a function', () => {
      const event = {
        effect: {
          onTrack: vi.fn()
        }
      }

      triggerOnTrack(event as any)
      expect(event.effect.onTrack).toHaveBeenCalledWith(event)
    })

    it('should not call onTrack handler when it does not exist', () => {
      const event = {
        effect: {}
      }

      expect(() => triggerOnTrack(event as any)).not.toThrow()
    })

    it('should not call onTrack handler when it is not a function', () => {
      const event = {
        effect: {
          onTrack: 'not-a-function'
        }
      }

      expect(() => triggerOnTrack(event as any)).not.toThrow()
    })

    it('should log error when onTrack handler throws', () => {
      const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {})
      const error = new Error('Test error')
      const event = {
        effect: {
          onTrack: vi.fn(() => {
            throw error
          })
        }
      }

      triggerOnTrack(event as any)
      expect(debugSpy).toHaveBeenCalledWith('[triggerOnTrack] Error in onTrack:', error)

      debugSpy.mockRestore()
    })
  })

  describe('triggerOnTrigger', () => {
    it('should call onTrigger handler when it exists and is a function', () => {
      const event = {
        effect: {
          onTrigger: vi.fn()
        }
      }

      triggerOnTrigger(event as any)
      expect(event.effect.onTrigger).toHaveBeenCalledWith(event)
    })

    it('should not call onTrigger handler when it does not exist', () => {
      const event = {
        effect: {}
      }

      expect(() => triggerOnTrigger(event as any)).not.toThrow()
    })

    it('should not call onTrigger handler when it is not a function', () => {
      const event = {
        effect: {
          onTrigger: 'not-a-function'
        }
      }

      expect(() => triggerOnTrigger(event as any)).not.toThrow()
    })

    it('should log error when onTrigger handler throws', () => {
      const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {})
      const error = new Error('Test error')
      const event = {
        effect: {
          onTrigger: vi.fn(() => {
            throw error
          })
        }
      }

      triggerOnTrigger(event as any)
      expect(debugSpy).toHaveBeenCalledWith('[triggerOnTrigger] Error in onTrigger:', error)

      debugSpy.mockRestore()
    })
  })
})
