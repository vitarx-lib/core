import { describe, expect, it, vi } from 'vitest'
import { ACTIVE_SCOPE } from '../../src/effect/symbol.js'
import {
  Context,
  EffectScope,
  onScopeDispose,
  onScopePause,
  onScopeResume
} from '../../src/index.js'

describe('effect/lifecycle', () => {
  describe('onScopeDispose', () => {
    it('should register dispose callback in active scope', () => {
      const scope = new EffectScope()
      const onDisposeSpy = vi.spyOn(scope, 'onDispose')
      const callback = vi.fn()

      Context.run(ACTIVE_SCOPE, scope, () => {
        onScopeDispose(callback)
        expect(onDisposeSpy).toHaveBeenCalledWith(callback)
      })
    })

    it('should warn when no active scope and failSilently is false', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const callback = vi.fn()

      onScopeDispose(callback, false)
      expect(warnSpy).toHaveBeenCalledWith(
        '[Vitarx.EffectScope] onScopeDispose() no active scope found'
      )

      warnSpy.mockRestore()
    })

    it('should not warn when no active scope and failSilently is true', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const callback = vi.fn()

      onScopeDispose(callback, true)
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })

  describe('onScopePause', () => {
    it('should register pause callback in active scope', () => {
      const scope = new EffectScope()
      const onPauseSpy = vi.spyOn(scope, 'onPause')
      const callback = vi.fn()

      Context.run(ACTIVE_SCOPE, scope, () => {
        onScopePause(callback)
        expect(onPauseSpy).toHaveBeenCalledWith(callback)
      })
    })

    it('should warn when no active scope and failSilently is false', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const callback = vi.fn()

      onScopePause(callback, false)
      expect(warnSpy).toHaveBeenCalledWith(
        '[Vitarx.EffectScope] onScopePause() no active scope found'
      )

      warnSpy.mockRestore()
    })

    it('should not warn when no active scope and failSilently is true', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const callback = vi.fn()

      onScopePause(callback, true)
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })

  describe('onScopeResume', () => {
    it('should register resume callback in active scope', () => {
      const scope = new EffectScope()
      const onResumeSpy = vi.spyOn(scope, 'onResume')
      const callback = vi.fn()

      Context.run(ACTIVE_SCOPE, scope, () => {
        onScopeResume(callback)
        expect(onResumeSpy).toHaveBeenCalledWith(callback)
      })
    })

    it('should warn when no active scope and failSilently is false', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const callback = vi.fn()

      onScopeResume(callback, false)
      expect(warnSpy).toHaveBeenCalledWith(
        '[Vitarx.EffectScope] onScopeResume() no active scope found'
      )

      warnSpy.mockRestore()
    })

    it('should not warn when no active scope and failSilently is true', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const callback = vi.fn()

      onScopeResume(callback, true)
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })
})
