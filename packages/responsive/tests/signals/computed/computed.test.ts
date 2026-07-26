import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { Computed, ref, watch } from '../../../src/index.js'

describe('signal/computed/computed', () => {
  describe('constructor', () => {
    it('should create a Computed instance', () => {
      const getter = vi.fn(() => 42)
      const computed = new Computed(getter)

      expect(computed).toBeInstanceOf(Computed)
      expect(computed.dirty).toBe(true)
    })
  })

  describe('value', () => {
    it('should compute value when accessed', () => {
      const source = ref(0)
      const computed = new Computed(() => source.value * 2)

      expect(computed.value).toBe(0)
      expect(computed.dirty).toBe(false)

      source.value = 2
      expect(computed.dirty).toBe(true)
      expect(computed.value).toBe(4)
      expect(computed.dirty).toBe(false)
    })

    it('should track access to value', async () => {
      const source = ref(0)
      const computed = new Computed(() => source.value * 2)
      const trackSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'trackSignal'
      )

      computed.value

      expect(trackSignalSpy).toHaveBeenCalledWith(computed, 'get')
    })
  })

  describe('setter', () => {
    it('should call setter when provided', () => {
      const source = ref(0)
      const setter = vi.fn(newValue => {
        source.value = newValue / 2
      })
      const computed = new Computed({ get: () => source.value * 2, set: setter })

      computed.value = 10

      expect(setter).toHaveBeenCalledWith(10)
      expect(source.value).toBe(5)
    })

    it('should warn when setting value without setter', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const computed = new Computed(() => 42)

      computed.value = 10

      expect(warnSpy).toHaveBeenCalledWith(
        '[computed] properties should not be modified directly unless a setter function is defined'
      )
      warnSpy.mockRestore()
    })
  })

  describe('run', () => {
    it('should mark as dirty and trigger signal when not already dirty', async () => {
      const source = ref(0)
      const computed = new Computed(() => source.value * 2)
      // Access value to make it not dirty
      const _ = computed.value
      expect(computed.dirty).toBe(false)

      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'triggerSignal'
      )

      computed['_effect']()

      expect(computed.dirty).toBe(true)
      expect(triggerSignalSpy).toHaveBeenCalledWith(computed, 'dirty')
    })

    it('should not trigger signal when already dirty', async () => {
      const source = ref(0)
      const computed = new Computed(() => source.value * 2)
      expect(computed.dirty).toBe(true)
      const cb = vi.fn()
      watch(computed, cb, { flush: 'sync' })
      expect(computed.dirty).toBe(false)
      computed['_effect']()
      expect(cb).not.toHaveBeenCalled()
    })
  })

  describe('toString', () => {
    it('should return string representation of value', () => {
      const computed = new Computed(() => 42)
      expect(computed.toString()).toBe('42')
    })

    it('should return object representation for complex values', () => {
      const computed = new Computed(() => ({ a: 1 }))
      expect(computed.toString()).toBe('[object Object]')
    })
  })

  describe('Symbol.toPrimitive', () => {
    it('should return value for number hint', () => {
      const computed = new Computed(() => 42)
      expect(+computed).toBe(42)
    })

    it('should return string representation for string hint', () => {
      const computed = new Computed(() => 42)
      expect(`${computed}`).toBe('42')
    })

    it('should return value for default hint', () => {
      const computed = new Computed(() => 42)
      expect(computed[Symbol.toPrimitive]('default')).toBe(42)
    })
  })

  describe('recomputed', () => {
    it('should collect dependencies during computation', async () => {
      const source = ref(0)
      const computed = new Computed(() => source.value * 2)
      const collectSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'trackEffect'
      )

      // Access value to trigger recomputation
      const _ = computed.value

      expect(collectSignalSpy).toHaveBeenCalled()
    })
  })

  // 回归测试：getter 抛错后 dirty 应保持 true，下次访问能重试
  // 对应修复：computed.ts recompute() 中 _dirty=false 仅在 try 成功路径执行，
  //          异常路径保持 _dirty=true，避免永久返回过期值
  describe('error recovery', () => {
    it('should keep dirty=true when getter throws and retry on next access', () => {
      let shouldThrow = true
      let callCount = 0
      const source = ref(1)
      // 无 owner scope：reportEffectError 直接抛出，验证异常路径 dirty 不被重置
      const computed = new Computed(() => {
        callCount++
        if (shouldThrow) throw new Error('getter boom')
        return source.value * 2
      })

      // 首次访问：getter 抛错，dirty 应保持 true（不再被 finally 错误重置为 false）
      expect(() => computed.value).toThrow('getter boom')
      expect(computed.dirty).toBe(true)
      expect(callCount).toBe(1)

      // 恢复 getter 正常，再次访问应重新计算（证明 dirty=true 触发了重试）
      shouldThrow = false
      expect(computed.value).toBe(2)
      expect(computed.dirty).toBe(false)
      expect(callCount).toBe(2)

      // 依赖变化后能正常重新计算
      source.value = 5
      expect(computed.dirty).toBe(true)
      expect(computed.value).toBe(10)
      expect(computed.dirty).toBe(false)
      expect(callCount).toBe(3)
    })
  })
})
