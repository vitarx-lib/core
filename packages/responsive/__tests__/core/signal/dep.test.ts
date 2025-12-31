import { describe, expect, it, vi } from 'vitest'
import {
  DEP_INDEX_MAP,
  DEP_VERSION,
  EFFECT_DEP_HEAD,
  EFFECT_DEP_TAIL,
  SIGNAL_DEP_HEAD,
  SIGNAL_DEP_TAIL
} from '../../../src/core/signal/symbol.js'
import {
  clearEffectDeps,
  clearSignalEffects,
  createDepLink,
  type DepEffectLike,
  DepLink,
  destroyDepLink,
  isWithEffect,
  isWithSignal,
  iterateEffectSignals,
  iterateSignalEffects,
  ref,
  type Signal
} from '../../../src/index.js'

describe('depend/link', () => {
  describe('createDepLink', () => {
    it('should create a bidirectional link between effect and signal', () => {
      const signal = ref(42)
      const effect = { run: vi.fn() }

      const link = createDepLink(effect as any, signal)

      // Check link properties
      expect(link.signal).toBe(signal)
      expect(link.effect).toBe(effect)

      // Check that effect has the link in its dependency list
      expect((effect as any)[EFFECT_DEP_HEAD]).toBe(link)
      expect((effect as any)[EFFECT_DEP_TAIL]).toBe(link)

      // Check that signal has the link in its dependency list
      expect((signal as any)[SIGNAL_DEP_HEAD]).toBe(link)
      expect((signal as any)[SIGNAL_DEP_TAIL]).toBe(link)
    })

    it('should properly link multiple dependencies for the same effect', () => {
      const signal1 = ref(1)
      const signal2 = ref(2)
      const effect = { run: vi.fn() }

      const link1 = createDepLink(effect as any, signal1)
      const link2 = createDepLink(effect as any, signal2)

      // Check that effect has both links in its dependency list
      expect((effect as any)[EFFECT_DEP_HEAD]).toBe(link1)
      expect((effect as any)[EFFECT_DEP_TAIL]).toBe(link2)

      // Check linking in effect dimension
      expect(link1.eNext).toBe(link2)
      expect(link2.ePrev).toBe(link1)

      // Check that each signal has its respective link
      expect((signal1 as any)[SIGNAL_DEP_HEAD]).toBe(link1)
      expect((signal1 as any)[SIGNAL_DEP_TAIL]).toBe(link1)
      expect((signal2 as any)[SIGNAL_DEP_HEAD]).toBe(link2)
      expect((signal2 as any)[SIGNAL_DEP_TAIL]).toBe(link2)
    })
  })

  describe('destroyDepLink', () => {
    it('should properly remove a link from both effect and signal dimensions', () => {
      const signal = ref(42)
      const effect = { run: vi.fn() }

      const link = createDepLink(effect as any, signal)

      // Verify link exists
      expect((effect as any)[EFFECT_DEP_HEAD]).toBe(link)
      expect((signal as any)[SIGNAL_DEP_HEAD]).toBe(link)

      // Destroy the link
      destroyDepLink(link)

      // Verify link is removed
      expect((effect as any)[EFFECT_DEP_HEAD]).toBeUndefined()
      expect((effect as any)[EFFECT_DEP_TAIL]).toBeUndefined()
      expect((signal as any)[SIGNAL_DEP_HEAD]).toBeUndefined()
      expect((signal as any)[SIGNAL_DEP_TAIL]).toBeUndefined()

      // Verify link pointers are cleared
      expect(link.ePrev).toBeUndefined()
      expect(link.eNext).toBeUndefined()
      expect(link.sigPrev).toBeUndefined()
      expect(link.sigNext).toBeUndefined()
    })
  })

  describe('clearEffectDeps', () => {
    it('should remove all dependencies for an effect', () => {
      const signal1 = ref(1)
      const signal2 = ref(2)
      const effect = { run: vi.fn() }

      createDepLink(effect as any, signal1)
      createDepLink(effect as any, signal2)

      // Verify dependencies exist
      expect((effect as any)[EFFECT_DEP_HEAD]).toBeDefined()
      expect((effect as any)[EFFECT_DEP_TAIL]).toBeDefined()

      // Clear dependencies
      clearEffectDeps(effect as any)

      // Verify dependencies are cleared
      expect((effect as any)[EFFECT_DEP_HEAD]).toBeUndefined()
      expect((effect as any)[EFFECT_DEP_TAIL]).toBeUndefined()
      expect((effect as any)[DEP_VERSION]).toBeUndefined()
      expect((effect as any)[DEP_INDEX_MAP]).toBeUndefined()
    })
  })

  describe('clearSignalEffects', () => {
    it('should remove all effects for a signal', () => {
      const signal = ref(42)
      const effect1 = { run: vi.fn() }
      const effect2 = { run: vi.fn() }

      createDepLink(effect1 as any, signal)
      createDepLink(effect2 as any, signal)

      // Verify effects exist
      expect((signal as any)[SIGNAL_DEP_HEAD]).toBeDefined()
      expect((signal as any)[SIGNAL_DEP_TAIL]).toBeDefined()

      // Clear effects
      clearSignalEffects(signal)

      // Verify effects are cleared
      expect((signal as any)[SIGNAL_DEP_HEAD]).toBeUndefined()
      expect((signal as any)[SIGNAL_DEP_TAIL]).toBeUndefined()
    })
  })

  describe('iterateSignalEffects', () => {
    it('should iterate over all effects dependent on a signal', () => {
      const signal = ref(42)
      const effect1 = { run: vi.fn() }
      const effect2 = { run: vi.fn() }

      createDepLink(effect1 as any, signal)
      createDepLink(effect2 as any, signal)

      const effects = Array.from(iterateSignalEffects(signal))

      expect(effects).toContain(effect1)
      expect(effects).toContain(effect2)
      expect(effects).toHaveLength(2)
    })

    it('should return empty iterator for signal with no effects', () => {
      const signal = ref(42)

      const effects = Array.from(iterateSignalEffects(signal))

      expect(effects).toHaveLength(0)
    })
  })

  describe('iterateEffectSignals', () => {
    it('should iterate over all signals an effect depends on', () => {
      const signal1 = ref(1)
      const signal2 = ref(2)
      const effect = { run: vi.fn() }

      createDepLink(effect as any, signal1)
      createDepLink(effect as any, signal2)

      const signals = Array.from(iterateEffectSignals(effect as any))

      expect(signals).toContain(signal1)
      expect(signals).toContain(signal2)
      expect(signals).toHaveLength(2)
    })

    it('should return empty iterator for effect with no dependencies', () => {
      const effect = { run: vi.fn() }

      const signals = Array.from(iterateEffectSignals(effect as any))

      expect(signals).toHaveLength(0)
    })
  })
  // 测试用例
  describe('isWithSignal', () => {
    it('当effect对象具有EFFECT_DEP_HEAD属性时应该返回true', () => {
      const effectWithSignal = { [EFFECT_DEP_HEAD]: {} } as DepEffectLike
      expect(isWithSignal(effectWithSignal)).toBe(true)
    })

    it('当effect对象不具有EFFECT_DEP_HEAD属性时应该返回false', () => {
      const effectWithoutSignal = {} as DepEffectLike
      expect(isWithSignal(effectWithoutSignal)).toBe(false)
    })

    it('当effect为null时应该返回false', () => {
      expect(isWithSignal(null as any)).toBe(false)
    })

    it('当effect为undefined时应该返回false', () => {
      expect(isWithSignal(undefined as any)).toBe(false)
    })

    it('当EFFECT_DEP_HEAD属性值为null时应该返回false', () => {
      const effectWithNullDep = { [EFFECT_DEP_HEAD]: null } as unknown as DepEffectLike
      expect(isWithSignal(effectWithNullDep)).toBe(false)
    })

    it('当EFFECT_DEP_HEAD属性值为undefined时应该返回false', () => {
      const effectWithUndefinedDep = { [EFFECT_DEP_HEAD]: undefined } as DepEffectLike
      expect(isWithSignal(effectWithUndefinedDep)).toBe(false)
    })
  })

  describe('isWithEffect', () => {
    it('should return true when signal has effect dependency', () => {
      const signal: Signal = {
        [SIGNAL_DEP_HEAD]: {} as DepLink
      }
      expect(isWithEffect(signal)).toBe(true)
    })

    it('should return false when signal has no effect dependency', () => {
      const signal: Signal = {}
      expect(isWithEffect(signal)).toBe(false)
    })

    it('should return false when signal is null', () => {
      expect(isWithEffect(null as any)).toBe(false)
    })

    it('should return false when signal is undefined', () => {
      expect(isWithEffect(undefined as any)).toBe(false)
    })

    it('should return false when SIGNAL_DEP_HEAD is undefined', () => {
      const signal: Signal = {
        [SIGNAL_DEP_HEAD]: undefined
      }
      expect(isWithEffect(signal)).toBe(false)
    })

    it('should return false when SIGNAL_DEP_HEAD is null', () => {
      const signal: Signal = {
        [SIGNAL_DEP_HEAD]: null as any
      }
      expect(isWithEffect(signal)).toBe(false)
    })
  })
})
