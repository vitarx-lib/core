import { nextTick, ref } from '@vitarx/responsive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { viewEffect } from '../../src/runtime/effect'

describe('runtime/effect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('viewEffect', () => {
    it('当没有信号依赖时应该返回 null', () => {
      const effect = vi.fn()

      const result = viewEffect(effect)

      expect(result).toBeNull()
      expect(effect).toHaveBeenCalled()
    })

    it('当有信号依赖时应该返回 ViewEffect 对象', () => {
      const result = viewEffect(() => ref('test').value)

      expect(result).toBeDefined()
      expect(result).not.toBeNull()
      expect(result?.dispose).toBeInstanceOf(Function)
      expect(result?.pause).toBeInstanceOf(Function)
      expect(result?.resume).toBeInstanceOf(Function)
    })

    it('应该立即执行 effect', () => {
      const effect = vi.fn()
      viewEffect(effect)
      expect(effect).toHaveBeenCalledTimes(1)
    })

    describe('ViewEffect methods', () => {
      it('应该暂停和恢复 effect', async () => {
        const test = ref(0)
        const effect = vi.fn(() => test.value)
        const viewEffectObj = viewEffect(effect)
        expect(viewEffectObj).not.toBeNull()
        // 模拟信号变化触发runner
        test.value++
        await nextTick()
        expect(effect).toHaveBeenCalledTimes(2)
        viewEffectObj?.pause()
        test.value++
        await nextTick()
        expect(effect).toHaveBeenCalledTimes(2)
        viewEffectObj?.resume()
        await nextTick()
        expect(effect).toHaveBeenCalledTimes(3)
      })

      it('应该销毁 effect', async () => {
        const test = ref(0)
        const effect = vi.fn(() => test.value)
        const viewEffectObj = viewEffect(effect)
        expect(viewEffectObj).not.toBeNull()
        viewEffectObj?.dispose()
        test.value++
        await nextTick()
        expect(effect).toHaveBeenCalledTimes(1)
      })

      it('恢复时如果不脏不应该执行 effect', () => {
        const test = ref(0)
        const effect = vi.fn(() => test.value)

        const viewEffectObj = viewEffect(effect)
        expect(viewEffectObj).not.toBeNull()
        viewEffectObj?.pause()
        viewEffectObj?.resume()
        expect(effect).toHaveBeenCalledTimes(1)
      })
    })
  })
})
