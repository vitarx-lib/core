import { logger, LogLevel, toCapitalize } from '@vitarx/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Lifecycle } from '../../src/constants/lifecycle.js'
import {
  defineExpose,
  defineValidate,
  onBeforeMount,
  onDispose,
  onError,
  onHide,
  onInit,
  onMounted,
  onShow,
  onViewSwitch
} from '../../src/index.js'
import { runComponent } from '../../src/runtime/context.js'
import type { Component } from '../../src/types'

describe('runtime/hook', () => {
  let mockInstance: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockInstance = {
      hooks: {},
      errorHandler: null,
      onViewSwitch: null,
      publicInstance: {},
      scope: {
        run: vi.fn((fn: () => any) => fn())
      }
    }
  })

  describe('lifecycle hooks', () => {
    const testHooks = [
      { name: 'onInit', hook: onInit, lifecycle: Lifecycle.init },
      { name: 'onBeforeMount', hook: onBeforeMount, lifecycle: Lifecycle.beforeMount },
      { name: 'onShow', hook: onShow, lifecycle: Lifecycle.show },
      { name: 'onHide', hook: onHide, lifecycle: Lifecycle.hide },
      { name: 'onMounted', hook: onMounted, lifecycle: Lifecycle.mounted },
      { name: 'onDispose', hook: onDispose, lifecycle: Lifecycle.dispose }
    ]

    testHooks.forEach(({ name, hook, lifecycle }) => {
      describe(name, () => {
        it(`应该在组件上下文中注册 ${name} 钩子`, () => {
          const callback = vi.fn()

          runComponent(mockInstance, () => {
            hook(callback)
            expect(mockInstance.hooks[lifecycle]).toBeDefined()
            expect(mockInstance.hooks[lifecycle]).toContain(callback)
          })
        })

        it(`应该添加到现有的 ${name} 钩子数组`, () => {
          const callback1 = vi.fn()
          const callback2 = vi.fn()

          runComponent(mockInstance, () => {
            hook(callback1)
            hook(callback2)
            expect(mockInstance.hooks[lifecycle].length).toBe(2)
            expect(mockInstance.hooks[lifecycle]).toContain(callback1)
            expect(mockInstance.hooks[lifecycle]).toContain(callback2)
          })
        })

        it(`当回调不是函数时在 DEV 模式下应该抛出错误`, () => {
          // 模拟 DEV 环境
          const originalDev = (global as any).__DEV__
          ;(global as any).__DEV__ = true

          try {
            runComponent(mockInstance, () => {
              expect(() => {
                hook('not a function' as any)
              }).toThrow(TypeError)
            })
          } finally {
            ;(global as any).__DEV__ = originalDev
          }
        })

        it(`在组件上下文外调用时应该记录错误`, () => {
          const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
          const callback = vi.fn()

          hook(callback)

          expect(consoleError).toHaveBeenCalledWith(
            logger.formatMessage(
              LogLevel.ERROR,
              `on${toCapitalize(lifecycle)}(): must be called in a component`
            )
          )
          consoleError.mockRestore()
        })
      })
    })
  })

  describe('onError', () => {
    it('应该在组件上下文中注册错误处理器', () => {
      const handler = vi.fn()

      runComponent(mockInstance, () => {
        onError(handler)
        expect(mockInstance.errorHandler).toBe(handler)
      })
    })

    it(`当处理器不是函数时在 DEV 模式下应该抛出错误`, () => {
      // 模拟 DEV 环境
      const originalDev = (global as any).__DEV__
      ;(global as any).__DEV__ = true

      try {
        runComponent(mockInstance, () => {
          expect(() => {
            onError('not a function' as any)
          }).toThrow(TypeError)
        })
      } finally {
        ;(global as any).__DEV__ = originalDev
      }
    })

    it('在组件上下文外调用时应该记录警告', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const handler = vi.fn()

      onError(handler)

      expect(consoleWarn).toHaveBeenCalled()
      consoleWarn.mockRestore()
    })
  })

  describe('onViewSwitch', () => {
    it('应该在组件上下文中注册视图切换处理器', () => {
      const handler = vi.fn()

      runComponent(mockInstance, () => {
        onViewSwitch(handler)
        expect(mockInstance.onViewSwitch).toBe(handler)
      })
    })

    it(`当处理器不是函数时在 DEV 模式下应该抛出错误`, () => {
      // 模拟 DEV 环境
      const originalDev = (global as any).__DEV__
      ;(global as any).__DEV__ = true

      try {
        runComponent(mockInstance, () => {
          expect(() => {
            onViewSwitch('not a function' as any)
          }).toThrow(TypeError)
        })
      } finally {
        ;(global as any).__DEV__ = originalDev
      }
    })

    it(`在 DEV 模式下多次调用时应该记录警告`, () => {
      // 模拟 DEV 环境
      const originalDev = (global as any).__DEV__
      ;(global as any).__DEV__ = true

      try {
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const handler1 = vi.fn()
        const handler2 = vi.fn()

        runComponent(mockInstance, () => {
          onViewSwitch(handler1)
          onViewSwitch(handler2)
          expect(consoleWarn).toHaveBeenCalled()
        })

        consoleWarn.mockRestore()
      } finally {
        ;(global as any).__DEV__ = originalDev
      }
    })

    it('在组件上下文外调用时应该记录警告', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const handler = vi.fn()

      onViewSwitch(handler)

      expect(consoleWarn).toHaveBeenCalled()
      consoleWarn.mockRestore()
    })
  })

  describe('defineExpose', () => {
    it('应该向公共实例暴露属性', () => {
      const exposed = {
        count: 0,
        increment: () => {}
      }

      runComponent(mockInstance, () => {
        defineExpose(exposed)
        expect(mockInstance.publicInstance.count).toBe(exposed.count)
        expect(mockInstance.publicInstance.increment).toBe(exposed.increment)
      })
    })

    it('在组件上下文外调用时应该记录错误', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const exposed = {}

      defineExpose(exposed)

      expect(consoleError).toHaveBeenCalledWith(
        logger.formatMessage(LogLevel.ERROR, `defineExpose(): must be called in a component`)
      )
      consoleError.mockRestore()
    })
  })

  describe('defineValidate', () => {
    it('应该在组件上定义 validateProps 函数', () => {
      const component = vi.fn() as Component
      const validator = vi.fn()

      defineValidate(component, validator)
      expect(component.validateProps).toBe(validator)
    })

    it(`当验证器不是函数时在 DEV 模式下应该抛出错误`, () => {
      // 模拟 DEV 环境
      const originalDev = (global as any).__DEV__
      ;(global as any).__DEV__ = true

      try {
        const component = vi.fn() as Component
        expect(() => {
          defineValidate(component, 'not a function' as any)
        }).toThrow(TypeError)
      } finally {
        ;(global as any).__DEV__ = originalDev
      }
    })
  })
})
