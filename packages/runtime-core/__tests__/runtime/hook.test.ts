import { describe, expect, it, vi } from 'vitest'
import {
  defineExpose,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onCreate,
  onDeactivated,
  onError,
  onMounted,
  onRender,
  onUnmounted,
  onUpdated
} from '../../src/index.js'

describe('runtime/hook', () => {
  describe('onCreate', () => {
    it('应该立即执行回调', () => {
      let called = false
      onCreate(() => {
        called = true
      })

      expect(called).toBe(true)
    })

    it('应该同步执行', () => {
      let value = 0
      onCreate(() => {
        value = 1
      })

      expect(value).toBe(1)
    })
  })

  describe('生命周期钩子注册', () => {
    it('onBeforeMount 应该接受回调函数', () => {
      const callback = vi.fn()
      expect(() => onBeforeMount(callback)).not.toThrow()
    })

    it('onMounted 应该接受回调函数', () => {
      const callback = vi.fn()
      expect(() => onMounted(callback)).not.toThrow()
    })

    it('onBeforeUpdate 应该接受回调函数', () => {
      const callback = vi.fn()
      expect(() => onBeforeUpdate(callback)).not.toThrow()
    })

    it('onUpdated 应该接受回调函数', () => {
      const callback = vi.fn()
      expect(() => onUpdated(callback)).not.toThrow()
    })

    it('onBeforeUnmount 应该接受回调函数', () => {
      const callback = vi.fn()
      expect(() => onBeforeUnmount(callback)).not.toThrow()
    })

    it('onUnmounted 应该接受回调函数', () => {
      const callback = vi.fn()
      expect(() => onUnmounted(callback)).not.toThrow()
    })

    it('onActivated 应该接受回调函数', () => {
      const callback = vi.fn()
      expect(() => onActivated(callback)).not.toThrow()
    })

    it('onDeactivated 应该接受回调函数', () => {
      const callback = vi.fn()
      expect(() => onDeactivated(callback)).not.toThrow()
    })

    it('onError 应该接受回调函数', () => {
      const callback = vi.fn()
      expect(() => onError(callback)).not.toThrow()
    })

    it('onRender 应该接受回调函数', () => {
      const callback = vi.fn()
      expect(() => onRender(callback)).not.toThrow()
    })
  })

  describe('钩子类型校验', () => {
    it('应该在传入非函数时抛出类型错误', () => {
      expect(() => onBeforeMount('not a function' as any)).toThrow(TypeError)
      expect(() => onBeforeMount('not a function' as any)).toThrow(/钩子必须是回调函数/)
    })

    it('应该在传入 null 时抛出类型错误', () => {
      expect(() => onMounted(null as any)).toThrow(TypeError)
    })

    it('应该在传入 undefined 时抛出类型错误', () => {
      expect(() => onUpdated(undefined as any)).toThrow(TypeError)
    })

    it('应该在传入对象时抛出类型错误', () => {
      expect(() => onBeforeUnmount({} as any)).toThrow(TypeError)
    })

    it('应该在传入数字时抛出类型错误', () => {
      expect(() => onUnmounted(123 as any)).toThrow(TypeError)
    })
  })

  describe('defineExpose', () => {
    it('应该接受对象参数', () => {
      const exposed = { count: 0, increment: () => {} }
      expect(() => defineExpose(exposed)).not.toThrow()
    })

    it('应该接受空对象', () => {
      expect(() => defineExpose({})).not.toThrow()
    })

    it('应该接受多个属性', () => {
      const exposed = {
        value: 1,
        method1: () => {},
        method2: () => {},
        data: { nested: true }
      }
      expect(() => defineExpose(exposed)).not.toThrow()
    })

    it('应该处理保留关键词', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // props 是保留关键词,defineExpose 应该过滤它
      const exposed = { props: 'should be removed', custom: 'should keep' }

      // defineExpose 会内部处理,但不会抛出错误
      expect(() => defineExpose(exposed)).not.toThrow()
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('应该处理 build 保留关键词', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const exposed = { build: () => {}, custom: 'value' }

      // defineExpose 会内部处理,但不会抛出错误
      expect(() => defineExpose(exposed)).not.toThrow()
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('钩子回调参数', () => {
    it('钩子应该支持箭头函数', () => {
      expect(() => onBeforeMount(() => {})).not.toThrow()
    })

    it('钩子应该支持普通函数', () => {
      expect(() => onMounted(function () {})).not.toThrow()
    })

    it('钩子应该支持异步函数', () => {
      expect(() => onBeforeUpdate(async () => {})).not.toThrow()
    })
  })

  describe('边界情况', () => {
    it('onCreate 应该处理抛出错误的回调', () => {
      expect(() => {
        onCreate(() => {
          throw new Error('Test error')
        })
      }).toThrow('Test error')
    })

    it('defineExpose 应该处理包含 undefined 值的对象', () => {
      const exposed = { valid: 'value', invalid: undefined }
      expect(() => defineExpose(exposed)).not.toThrow()
    })

    it('defineExpose 应该处理包含 null 值的对象', () => {
      const exposed = { value: null }
      expect(() => defineExpose(exposed)).not.toThrow()
    })
  })
})
