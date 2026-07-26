import { describe, expect, it, vi } from 'vitest'
import { logger } from '@vitarx/utils'
import { SIGNAL_DEP_HEAD } from '../../../src/core/signal/symbol.js'
import { ref, triggerSignal } from '../../../src/index.js'

describe('depend/trigger', () => {
  describe('triggerSignal', () => {
    it('should trigger all dependent effects', () => {
      const signal = ref(42)

      // Create mock effects
      const effect1 = vi.fn()
      const effect2 = vi.fn()

      // Mock the signal's dependency head to point to our mock effects
      // We'll simulate the linked list structure
      const mockLink1 = {
        effect: effect1,
        sigNext: null // No next link
      }

      // Set up the signal's dependency head
      ;(signal as any)[SIGNAL_DEP_HEAD] = {
        effect: effect2,
        sigNext: mockLink1 // Point to first link
      }

      triggerSignal(signal, 'set')

      // Both effects should have been run
      expect(effect1).toHaveBeenCalled()
      expect(effect2).toHaveBeenCalled()
    })

    // 回归测试：单个 effect 抛错不应中断其他 effect 的触发
    // 对应修复：trigger.ts 中 effect() 调用包裹 try-catch，对齐 Vue3 callWithErrorHandling
    it('should not interrupt other effects when one effect throws', () => {
      const signal = ref(42)

      // 第一个 effect 抛错，第二个 effect 应仍被触发
      const throwingEffect = vi.fn(() => {
        throw new Error('effect boom')
      })
      const normalEffect = vi.fn()

      // 构建链表：head -> throwingEffect -> normalEffect -> null
      const normalLink = { effect: normalEffect, sigNext: null }
      ;(signal as any)[SIGNAL_DEP_HEAD] = {
        effect: throwingEffect,
        sigNext: normalLink
      }

      // 抑制 logger.error 的控制台输出，避免测试噪声
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})

      // 不应抛错（错误被隔离）
      expect(() => triggerSignal(signal, 'set')).not.toThrow()

      // 两个 effect 都应被调用（抛错的 effect 不中断遍历）
      expect(throwingEffect).toHaveBeenCalledTimes(1)
      expect(normalEffect).toHaveBeenCalledTimes(1)

      // 错误应被 logger.error 记录
      expect(errorSpy).toHaveBeenCalledWith(
        '[triggerSignal] effect execution error:',
        expect.any(Error)
      )

      errorSpy.mockRestore()
    })

    it('should call triggerOnTrigger in dev mode', async () => {
      const signal = ref(42)

      // Create mock effect
      const effect = vi.fn()

      // Mock the linked list

      ;(signal as any)[SIGNAL_DEP_HEAD] = {
        effect,
        sigNext: null
      }

      // Mock triggerOnTrigger for dev environment
      const debugModule = await import('../../../src/core/signal/debug.js')
      const triggerOnTriggerSpy = vi
        .spyOn(debugModule, 'triggerOnTrigger')
        .mockImplementation(() => {})

      triggerSignal(signal, 'set', { key: 'test' })

      // In dev mode, triggerOnTrigger should be called
      if ((globalThis as any).__VITARX_DEV__) {
        expect(triggerOnTriggerSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            effect,
            signal,
            type: 'set',
            key: 'test'
          })
        )
      }

      // Effect should still be run
      expect(effect).toHaveBeenCalled()
    })

    it('should handle signal with no dependencies', () => {
      const signal = ref(42)

      // Ensure signal has no dependencies
      ;(signal as any)[SIGNAL_DEP_HEAD] = undefined

      // This should not throw
      expect(() => {
        triggerSignal(signal, 'set')
      }).not.toThrow()
    })
  })
})
