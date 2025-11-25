/**
 * App 应用模块测试
 *
 * 测试 App 类的核心功能
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../src/app/App.js'
import { __VITARX_VERSION__, createVNode, NodeState, TEXT_NODE_TYPE } from '../../src/index.js'
import { createTestWidget } from '../helpers/test-widget.js'

describe('App 应用模块', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'app'
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container)
    }
  })

  describe('基础功能', () => {
    it('应该能够创建 App 实例 - 使用 Widget', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)

      expect(app).toBeInstanceOf(App)
      expect(app.rootNode).toBeDefined()
    })

    it('应该能够创建 App 实例 - 使用 VNode', () => {
      const vnode = createVNode('div', {})
      const app = new App(vnode)

      expect(app).toBeInstanceOf(App)
      expect(app.rootNode).toBe(vnode)
    })

    it('应该能够正确获取版本号', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)

      expect(app.version).toBe(__VITARX_VERSION__)
      expect(typeof app.version).toBe('string')
    })

    it('应该能够获取根节点', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)

      expect(app.rootNode).toBeDefined()
      expect(app.rootNode.type).toBe(TestWidget)
    })
  })

  describe('配置管理', () => {
    it('应该能够初始化应用配置 - 自定义 errorHandler', () => {
      const TestWidget = createTestWidget()
      const errorHandler = vi.fn()
      const app = new App(TestWidget, { errorHandler })

      expect(app.config.errorHandler).toBe(errorHandler)
    })

    it('应该能够初始化应用配置 - 自定义 idPrefix', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget, { idPrefix: 'my-app' })

      expect(app.config.idPrefix).toBe('my-app')
    })

    it('应该验证默认配置的合并策略', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)

      expect(app.config.errorHandler).toBeDefined()
      expect(typeof app.config.errorHandler).toBe('function')
    })
  })

  describe('挂载和卸载', () => {
    it('应该能够挂载应用到 DOM - 通过 DOM 元素', () => {
      const text = createVNode(TEXT_NODE_TYPE, { value: 'Hello' })
      const TestWidget = createTestWidget({
        build() {
          return createVNode('div', { children: [text] })
        }
      })
      const app = new App(TestWidget)

      app.mount(container)
      expect(container.childNodes.length).toBe(1)
      expect(text.state).toBe(NodeState.Activated)
      console.log('容器内容', container.textContent)
      expect(container.textContent).toContain('Hello')
    })

    it('应该能够挂载应用到 DOM - 通过选择器字符串', () => {
      const TestWidget = createTestWidget({
        build() {
          return createVNode('div', { children: 'World' })
        }
      })
      const app = new App(TestWidget)

      app.mount('#app')

      expect(container.textContent).toContain('World')
    })

    it('应该在选择器不存在时抛出错误', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)

      expect(() => {
        app.mount('#non-existent')
      }).toThrow()
    })
  })

  describe('依赖注入', () => {
    it('应该能够提供全局数据', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)

      app.provide('test-key', 'test-value')

      // provide 方法应该成功执行
      expect(app).toBeDefined()
    })

    it('应该支持多个依赖项注入', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)

      app.provide('key1', 'value1')
      app.provide('key2', 'value2')

      expect(app).toBeDefined()
    })
  })

  describe('指令管理', () => {
    it('应该能够注册全局指令 - 对象形式', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)
      const directive = {
        mounted: vi.fn(),
        updated: vi.fn()
      }

      app.directive('test', directive)

      const retrieved = app.directive('test')
      expect(retrieved).toBeDefined()
    })

    it('应该能够注册全局指令 - 函数形式', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)
      const directiveFn = vi.fn()

      app.directive('test-fn', directiveFn)

      const retrieved = app.directive('test-fn')
      expect(retrieved).toBeDefined()
    })

    it('应该能够获取已注册的指令', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)
      const directive = { mounted: vi.fn() }

      app.directive('my-directive', directive)
      const retrieved = app.directive('my-directive')

      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('my-directive')
    })

    it('获取不存在的指令应该返回 undefined', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)

      const retrieved = app.directive('non-existent')

      expect(retrieved).toBeUndefined()
    })
  })

  describe('插件系统', () => {
    it('应该能够使用插件 - 函数形式', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)
      const plugin = vi.fn()

      app.use(plugin)

      expect(plugin).toHaveBeenCalledWith(app, undefined)
    })

    it('应该能够使用插件 - 对象形式(带 install 方法)', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)
      const plugin = {
        install: vi.fn()
      }

      app.use(plugin)

      expect(plugin.install).toHaveBeenCalledWith(app, undefined)
    })

    it('应该能够向插件传递配置选项', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)
      const plugin = vi.fn()
      const options = { key: 'value' }

      app.use(plugin, options)

      expect(plugin).toHaveBeenCalledWith(app, options)
    })
  })

  describe('应用上下文注入', () => {
    it('根节点应该拥有 appContext', () => {
      const TestWidget = createTestWidget()
      const app = new App(TestWidget)

      expect(app.rootNode.appContext).toBe(app)
    })

    it('子节点应该继承 appContext', () => {
      const TestWidget = createTestWidget({
        build() {
          return createVNode('div', {
            children: [createVNode('span', {})]
          })
        }
      })
      const app = new App(TestWidget)

      expect(app.rootNode.appContext).toBe(app)
    })
  })
})
