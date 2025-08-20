import type { ErrorHandler } from '@vitarx/runtime-core'
import { createVNode, onMounted, onUnmounted, VNode, type WidgetType } from '@vitarx/runtime-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App, createApp } from '../src'

// Mock DOM相关
const mockMount = vi.fn()
const mockUnmount = vi.fn()

// Mock WidgetVNode
const mockWidgetVNode = createVNode(() => null)

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('构造函数', () => {
    it('应该能通过函数组件创建App实例', () => {
      const mockWidget = vi.fn(() => null)
      const app = new App(mockWidget)
      app.mount(document.createElement('div'))
      expect(mockWidget).toBeCalled()
    })

    it('应该能通过WidgetVNode类型的node创建App实例', () => {
      const app = new App(mockWidgetVNode)
      expect(app).toBeInstanceOf(App)
    })

    it('当node为其他类型时应该抛出错误', () => {
      const invalidNode = {} as VNode | WidgetType
      expect(() => new App(invalidNode)).toThrow('The root node must be a widget')
    })

    it('应该正确设置默认错误处理函数', () => {
      const mockWidget: WidgetType = vi.fn()
      const app = new App(mockWidget)
      expect(typeof app.config.errorHandler).toBe('function')
    })

    it('应该能覆盖默认错误处理函数', () => {
      const mockErrorHandler: ErrorHandler = vi.fn()
      const mockWidget: WidgetType = vi.fn()
      const app = new App(mockWidget, { errorHandler: mockErrorHandler })

      expect(app.config.errorHandler).toBe(mockErrorHandler)
    })
  })

  describe('mount方法', () => {
    it('应该能通过选择器字符串挂载应用', () => {
      const mockWidget: WidgetType = () => {
        onMounted(mockMount)
        return null
      }
      const app = new App(mockWidget)
      const mockContainer = document.createElement('div')
      mockContainer.id = 'app'
      document.body.appendChild(mockContainer)
      const result = app.mount('#app')
      expect(mockMount).toHaveBeenCalled()
      expect(result).toBe(app)
    })

    it('应该能通过DOM元素挂载应用', () => {
      const mockWidget: WidgetType = () => {
        onMounted(mockMount)
        return null
      }
      const app = new App(mockWidget)
      const mockContainer = document.createElement('div')

      const result = app.mount(mockContainer)

      expect(mockMount).toHaveBeenCalled()
      expect(result).toBe(app)
    })

    it('当选择器找不到对应元素时应该抛出错误', () => {
      const mockWidget: WidgetType = vi.fn()
      const app = new App(mockWidget)
      expect(() => app.mount('#nonexistent')).toThrow(
        '[Vitarx.createApp][ERROR]: The element corresponding to the specified selector null was not found.'
      )
    })
  })

  describe('unmount方法', () => {
    it('应该调用内部节点的unmount方法', () => {
      const mockWidget: WidgetType = vi.fn(() => {
        onUnmounted(mockUnmount)
        return null
      })
      const app = new App(mockWidget)

      app.unmount()

      expect(mockUnmount).toHaveBeenCalled()
    })
  })

  describe('provide/getProvide方法', () => {
    it('应该能提供和获取值', () => {
      const mockWidget: WidgetType = vi.fn()
      const app = new App(mockWidget)
      const testValue = 'test'

      app.provide('testKey', testValue)
      const result = app.getProvide('testKey')

      expect(result).toBe(testValue)
    })

    it('当值不存在但提供默认值时应该返回默认值', () => {
      const mockWidget: WidgetType = vi.fn()
      const app = new App(mockWidget)
      const defaultValue = 'default'

      const result = app.getProvide('nonexistentKey', defaultValue)

      expect(result).toBe(defaultValue)
    })

    it('当值不存在且无默认值时应该返回undefined', () => {
      const mockWidget: WidgetType = vi.fn()
      const app = new App(mockWidget)

      const result = app.getProvide('nonexistentKey')

      expect(result).toBeUndefined()
    })
  })

  describe('use方法', () => {
    it('应该能安装函数类型的插件', () => {
      const mockWidget: WidgetType = vi.fn()
      const app = new App(mockWidget)
      const mockPlugin = vi.fn()

      const result = app.use(mockPlugin)

      expect(mockPlugin).toHaveBeenCalledWith(app, undefined)
      expect(result).toBe(app)
    })

    it('应该能安装有install方法的对象类型的插件', () => {
      const mockWidget: WidgetType = vi.fn()
      const app = new App(mockWidget)
      const mockInstall = vi.fn()
      const mockPlugin = { install: mockInstall }

      const result = app.use(mockPlugin)

      expect(mockInstall).toHaveBeenCalledWith(app, undefined)
      expect(result).toBe(app)
    })

    it('当对象类型的插件没有install方法时应该抛出错误', () => {
      const mockWidget: WidgetType = vi.fn()
      const app = new App(mockWidget)
      const mockPlugin = {} as any

      expect(() => app.use(mockPlugin)).toThrow(
        '[Vitarx.App.use][ERROR]: The plugin must be a function or an object with an install method.'
      )
    })

    it('当插件为其他类型时应该抛出错误', () => {
      const mockWidget: WidgetType = vi.fn()
      const app = new App(mockWidget)
      const mockPlugin = 123 as any

      expect(() => app.use(mockPlugin)).toThrow(
        '[Vitarx.App.use][ERROR]: The plugin must be a function or an object with an install method.'
      )
    })

    it('应该能传递选项给插件', () => {
      const mockWidget: WidgetType = vi.fn()
      const app = new App(mockWidget)
      const mockPlugin = vi.fn()
      const options = { test: 'option' }

      const result = app.use(mockPlugin, options)

      expect(mockPlugin).toHaveBeenCalledWith(app, options)
      expect(result).toBe(app)
    })
  })
})

describe('createApp函数', () => {
  it('应该能创建App实例', () => {
    const mockWidget: WidgetType = vi.fn()
    const app = createApp(mockWidget)

    expect(app).toBeInstanceOf(App)
  })
})
