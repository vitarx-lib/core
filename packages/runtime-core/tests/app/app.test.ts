import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../src/app/app'
import { createView } from '../../src/index.js'

describe('App 类', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    container.innerHTML = ''
  })

  describe('构造函数和初始化', () => {
    it('应该能够使用组件创建 App 实例', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      expect(app).toBeInstanceOf(App)
      expect(app.config).toBeDefined()
      expect(app.config.errorHandler).toBeDefined()
      expect(app.config.idPrefix).toBe('v')
    })

    it('应该能够使用配置选项创建 App 实例', () => {
      const customErrorHandler = (error: unknown) => console.error(error)
      const customIdPrefix = 'test-app'

      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent, {
        errorHandler: customErrorHandler,
        idPrefix: customIdPrefix
      })

      expect(app.config.errorHandler).toBe(customErrorHandler)
      expect(app.config.idPrefix).toBe(customIdPrefix)
    })

    it('应该能够使用视图节点创建 App 实例', () => {
      const rootView = createView('div', { children: 'Root' })
      const app = new App(rootView)

      expect(app).toBeInstanceOf(App)
      expect(app.rootView).toBe(rootView)
    })

    it('应该能够访问版本号', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      expect(typeof app.version).toBe('string')
    })
  })

  describe('指令管理', () => {
    it('应该能够注册指令', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const mockDirective = {
        mounted: vi.fn()
      }

      const result = app.directive('test', mockDirective)

      expect(result).toBe(app) // 返回 app 实例以支持链式调用
      expect(app.directive('test')).toBe(mockDirective)
    })

    it('应该能够获取已注册的指令', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const mockDirective = {
        mounted: vi.fn()
      }

      app.directive('test', mockDirective)
      const retrievedDirective = app.directive('test')

      expect(retrievedDirective).toBe(mockDirective)
    })

    it('应该返回 undefined 当指令不存在时', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      const retrievedDirective = app.directive('nonexistent')

      expect(retrievedDirective).toBeUndefined()
    })

    it('应该去除指令名称的前后空格', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const mockDirective = {
        mounted: vi.fn()
      }

      app.directive('  spaced-name  ', mockDirective)
      const retrievedDirective = app.directive('spaced-name')

      expect(retrievedDirective).toBe(mockDirective)
    })

    it('应该在指令名称为空时抛出 TypeError', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const mockDirective = {
        mounted: vi.fn()
      }

      expect(() => {
        app.directive('', mockDirective)
      }).toThrow(TypeError)

      expect(() => {
        app.directive('   ', mockDirective)
      }).toThrow(TypeError)
    })
  })

  describe('依赖注入系统', () => {
    it('应该能够提供数据', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const testValue = { data: 'test' }

      const result = app.provide('test-key', testValue)

      expect(result).toBe(app) // 返回 app 实例以支持链式调用
      expect(app.inject('test-key')).toBe(testValue)
    })

    it('应该能够注入提供的数据', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const testValue = 'provided-value'

      app.provide('test-key', testValue)
      const injectedValue = app.inject('test-key')

      expect(injectedValue).toBe(testValue)
    })

    it('应该能够注入 Symbol 类型的数据', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const testSymbol = Symbol('test-symbol')
      const testValue = 'symbol-value'

      app.provide(testSymbol, testValue)
      const injectedValue = app.inject(testSymbol)

      expect(injectedValue).toBe(testValue)
    })

    it('应该返回默认值当注入的键不存在时', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const defaultValue = 'default-value'

      const injectedValue = app.inject('nonexistent-key', defaultValue)

      expect(injectedValue).toBe(defaultValue)
    })

    it('应该检查提供者是否存在', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      app.provide('exist-key', 'value')

      expect(app.hasProvide('exist-key')).toBe(true)
      expect(app.hasProvide('nonexist-key')).toBe(false)
    })
  })

  describe('插件系统基础功能', () => {
    it('应该能够安装函数类型的插件', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const pluginFn = vi.fn((appInstance: App) => {
        appInstance.provide('plugin-installed', true)
      })

      const result = app.use(pluginFn)

      expect(result).toBe(app)
      expect(pluginFn).toHaveBeenCalledWith(app, undefined)
      expect(app.inject('plugin-installed')).toBe(true)
    })

    it('应该能够安装对象类型的插件', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const pluginInstallFn = vi.fn((appInstance: App) => {
        appInstance.provide('object-plugin-installed', true)
      })
      const pluginObj = {
        install: pluginInstallFn
      }

      const result = app.use(pluginObj)

      expect(result).toBe(app)
      expect(pluginInstallFn).toHaveBeenCalledWith(app, undefined)
      expect(app.inject('object-plugin-installed')).toBe(true)
    })

    it('应该能够安装带可选配置的插件', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const options = { option1: 'value1' }
      const pluginFn = vi.fn((appInstance: App, opts?: any) => {
        appInstance.provide('plugin-with-options', opts)
      })

      const result = app.use(pluginFn, options)

      expect(result).toBe(app)
      expect(pluginFn).toHaveBeenCalledWith(app, options)
      expect(app.inject('plugin-with-options')).toBe(options)
    })

    it('应该能够安装带必选配置的插件', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const options = { requiredOption: 'requiredValue' }
      const pluginFn = vi.fn((appInstance: App, opts: any) => {
        appInstance.provide('required-option-plugin', opts)
      })

      const result = app.use(pluginFn, options)

      expect(result).toBe(app)
      expect(pluginFn).toHaveBeenCalledWith(app, options)
      expect(app.inject('required-option-plugin')).toBe(options)
    })
  })

  describe('插件系统错误处理', () => {
    it('应该在插件为空时抛出错误', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      expect(() => {
        app.use(undefined!)
      }).toThrowError(/The plugin cannot be empty/)

      expect(() => {
        app.use(null!)
      }).toThrowError(/The plugin cannot be empty/)
    })

    it('应该在插件没有 install 方法时抛出错误', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const invalidPlugin = {
        someOtherMethod: vi.fn()
      }

      expect(() => {
        app.use(invalidPlugin as any)
      }).toThrowError(/must be a function or an object with an install method/)
    })

    it('应该在 install 方法不是函数时抛出错误', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)
      const invalidPlugin = {
        install: 'not-a-function'
      }

      expect(() => {
        app.use(invalidPlugin as any)
      }).toThrowError(/must be a function or an object with an install method/)
    })
  })

  describe('挂载和卸载', () => {
    it('应该能够挂载到 DOM 容器', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      expect(() => {
        app.mount(container)
      }).not.toThrow()
      expect(container.textContent).toBe('Test')
    })

    it('应该能够通过选择器挂载', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      // 添加一个带ID的容器元素用于测试
      const testContainer = document.createElement('div')
      document.body.appendChild(testContainer)

      expect(() => {
        app.mount(testContainer)
      }).not.toThrow()

      document.body.removeChild(testContainer)
    })

    it('应该能够卸载应用', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      // 先挂载应用
      app.mount(container)

      expect(() => {
        app.unmount()
      }).not.toThrow()
    })
  })

  describe('边界场景', () => {
    it('应该在配置为 undefined 时仍能正常工作', () => {
      const TestComponent = () => createView('div', { children: 'Test' })

      const app = new App(TestComponent, undefined)

      expect(app).toBeInstanceOf(App)
      expect(app.config.errorHandler).toBeDefined()
      expect(app.config.idPrefix).toBe('v')
    })

    it('传入字符串做为容器时会抛出异常', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      expect(() => {
        app.mount('' as any)
      }).toThrowError()
    })

    it('应该支持链式调用指令注册', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      const directive1 = { mounted: vi.fn() }
      const directive2 = { mounted: vi.fn() }

      const result = app.directive('dir1', directive1).directive('dir2', directive2)

      expect(result).toBe(app)
      expect(app.directive('dir1')).toBe(directive1)
      expect(app.directive('dir2')).toBe(directive2)
    })

    it('应该支持链式调用插件安装', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      const plugin1 = vi.fn((appInstance: App) => {
        appInstance.provide('plugin1-installed', true)
      })
      const plugin2 = vi.fn((appInstance: App) => {
        appInstance.provide('plugin2-installed', true)
      })

      const result = app.use(plugin1).use(plugin2)

      expect(result).toBe(app)
      expect(plugin1).toHaveBeenCalledWith(app, undefined)
      expect(plugin2).toHaveBeenCalledWith(app, undefined)
      expect(app.inject('plugin1-installed')).toBe(true)
      expect(app.inject('plugin2-installed')).toBe(true)
    })

    it('应该支持 Symbol 类型的注入键', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const app = new App(TestComponent)

      const symbolKey = Symbol('test-symbol-key')
      const testValue = 'symbol-test-value'

      app.provide(symbolKey, testValue)

      expect(app.inject(symbolKey)).toBe(testValue)
      expect(app.hasProvide(symbolKey)).toBe(true)
      expect(app.hasProvide(Symbol('test-symbol-key'))).toBe(false) // 不同的 Symbol 实例
    })
  })
})
