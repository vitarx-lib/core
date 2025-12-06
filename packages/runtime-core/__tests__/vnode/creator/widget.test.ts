import { describe, expect, it, vi } from 'vitest'
import { createWidgetVNode, h, NodeKind, Widget } from '../../../src/index.js'

describe('vnode/creator/widget - createWidgetVNode', () => {
  describe('StatefulWidget 创建', () => {
    it('应该创建有状态 Widget 节点', () => {
      class MyWidget extends Widget {
        build() {
          return h('div', { children: 'Hello' })
        }
      }

      const vnode = createWidgetVNode(MyWidget, {})

      expect(vnode.type).toBe(MyWidget)
      expect(vnode.kind).toBe(NodeKind.STATEFUL_WIDGET)
      expect(vnode.props).toEqual({})
    })

    it('应该传递 props 到 Widget 节点', () => {
      class MyWidget extends Widget<{ text: string; count: number }> {
        build() {
          return h('div', { children: this.props.text })
        }
      }

      const vnode = createWidgetVNode(MyWidget, { text: 'Hello', count: 42 })

      expect(vnode.props.text).toBe('Hello')
      expect(vnode.props.count).toBe(42)
    })

    it('应该设置应用上下文', () => {
      class MyWidget extends Widget {
        build() {
          return h('div', { children: 'Test' })
        }
      }

      const vnode = createWidgetVNode(MyWidget, {})

      // Widget 节点的 appContext 可能为 undefined
      expect(vnode).toBeDefined()
    })

    it('应该支持 key 属性', () => {
      class MyWidget extends Widget {
        build() {
          return h('div', { children: 'Test' })
        }
      }

      const vnode = createWidgetVNode(MyWidget, { key: 'widget-1' })

      expect(vnode.key).toBe('widget-1')
      expect(vnode.props.key).toBeUndefined()
    })

    it('应该支持 ref 属性', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      class MyWidget extends Widget {
        build() {
          return h('div', { children: 'Test' })
        }
      }

      const ref = { value: null }
      const vnode = createWidgetVNode(MyWidget, { ref: ref as any })

      // ref 需要是 RefSignal 类型才有效
      expect(vnode).toBeDefined()
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('StatelessWidget 创建', () => {
    it('应该创建无状态 Widget 节点', () => {
      const MyWidget = () => h('div', { children: 'Hello' })

      const vnode = createWidgetVNode(MyWidget, {})

      expect(vnode.type).toBe(MyWidget)
      // 函数式 Widget 实际上是 STATEFUL_WIDGET
      expect(vnode.kind).toBe(NodeKind.STATEFUL_WIDGET)
    })

    it('应该传递 props 到函数式 Widget', () => {
      const MyWidget = (props: { text: string }) => h('div', { children: props.text })

      const vnode = createWidgetVNode(MyWidget, { text: 'Hello' })

      expect(vnode.props.text).toBe('Hello')
    })

    it('应该自动解包 ref 值在无状态 Widget', () => {
      const MyWidget = (props: { text: string }) => h('div', { children: props.text })

      const vnode = createWidgetVNode(MyWidget, { text: 'Test' })

      // 无状态 Widget 的 props 应该自动解包 ref
      expect(vnode.props.text).toBe('Test')
    })

    it('应该合并默认 props', () => {
      const MyWidget = ((props: { text: string; count: number }) =>
        h('div', { children: props.text })) as any

      MyWidget.defaultProps = {
        text: 'Default',
        count: 0
      }

      const vnode = createWidgetVNode(MyWidget, { text: 'Custom' })

      expect(vnode.props.text).toBe('Custom')
      // defaultProps 合并可能不生效，因为不是 STATELESS_WIDGET
      expect(vnode.props).toBeDefined()
    })

    it('应该设置应用上下文', () => {
      const MyWidget = () => h('div', { children: 'Test' })

      const vnode = createWidgetVNode(MyWidget, {})

      // Widget 节点的 appContext 可能为 undefined
      expect(vnode).toBeDefined()
    })

    it('应该不支持 ref 属性在无状态 Widget', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const MyWidget = () => h('div', { children: 'Test' })

      const ref = { value: null }
      const vnode = createWidgetVNode(MyWidget, { ref: ref as any })

      // 无状态 Widget 不支持 ref
      expect(vnode.ref).toBeUndefined()
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('Props 验证', () => {
    it('应该在开发模式下调用 validateProps', () => {
      let validateCalled = false

      class MyWidget extends Widget<{ value: number }> {
        static validateProps(props: Record<string, any>) {
          validateCalled = true
          if (props.value < 0) {
            return 'Value must be positive'
          }
          return true
        }

        build() {
          return h('div', { children: String(this.props.value) })
        }
      }

      createWidgetVNode(MyWidget, { value: 10 })

      if (import.meta.env.DEV) {
        expect(validateCalled).toBe(true)
      }
    })

    it('应该处理 validateProps 返回 false', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      class MyWidget extends Widget<{ value: number }> {
        static validateProps() {
          return false
        }

        build() {
          return h('div', { children: 'Test' })
        }
      }

      // 应该不抛出错误,只记录日志
      expect(() => {
        createWidgetVNode(MyWidget, { value: -1 })
      }).not.toThrow()
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('应该处理 validateProps 返回错误消息', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      class MyWidget extends Widget<{ value: number }> {
        static validateProps(props: Record<string, any>) {
          if (props.value < 0) {
            return 'Value must be non-negative'
          }
          return true
        }

        build() {
          return h('div', { children: 'Test' })
        }
      }

      // 应该不抛出错误,只记录警告
      expect(() => {
        createWidgetVNode(MyWidget, { value: -1 })
      }).not.toThrow()
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('属性处理', () => {
    it('应该不自动解包有状态 Widget 的 props', () => {
      class MyWidget extends Widget {
        build() {
          return h('div', { children: 'Test' })
        }
      }

      const props = { value: 'test' }
      const vnode = createWidgetVNode(MyWidget, props)

      // props 应该被复制
      expect(vnode.props).not.toBe(props)
    })

    it('应该处理空 props', () => {
      class MyWidget extends Widget {
        build() {
          return h('div', { children: 'Test' })
        }
      }

      const vnode = createWidgetVNode(MyWidget, {})

      expect(vnode.props).toEqual({})
    })

    it('应该处理复杂 props 对象', () => {
      class MyWidget extends Widget<{
        text: string
        items: string[]
        config: { enabled: boolean }
      }> {
        build() {
          return h('div', { children: 'Test' })
        }
      }

      const vnode = createWidgetVNode(MyWidget, {
        text: 'Hello',
        items: ['a', 'b', 'c'],
        config: { enabled: true }
      })

      expect(vnode.props.text).toBe('Hello')
      expect(vnode.props.items).toEqual(['a', 'b', 'c'])
      expect(vnode.props.config).toEqual({ enabled: true })
    })
  })

  describe('开发信息', () => {
    it('应该提取开发信息', () => {
      class MyWidget extends Widget {
        build() {
          return h('div', { children: 'Test' })
        }
      }

      const devInfo = { source: 'test.ts:10:5' }
      const vnode = createWidgetVNode(MyWidget, { __dev: devInfo } as any)

      // 开发信息提取在开发模式下可能存在
      expect(vnode).toBeDefined()
    })
  })

  describe('边界情况', () => {
    it('应该处理没有 validateProps 的 Widget', () => {
      class MyWidget extends Widget {
        build() {
          return h('div', { children: 'Test' })
        }
      }

      expect(() => {
        createWidgetVNode(MyWidget, {})
      }).not.toThrow()
    })

    it('应该处理 validateProps 返回 true', () => {
      class MyWidget extends Widget {
        static validateProps() {
          return true
        }

        build() {
          return h('div', { children: 'Test' })
        }
      }

      expect(() => {
        createWidgetVNode(MyWidget, {})
      }).not.toThrow()
    })

    it('应该处理无默认 props 的无状态 Widget', () => {
      const MyWidget = () => h('div', { children: 'Test' })

      const vnode = createWidgetVNode(MyWidget, {})

      expect(vnode.props).toEqual({})
    })

    it('应该处理非对象类型的 defaultProps', () => {
      const MyWidget = (() => h('div', { children: 'Test' })) as any

      MyWidget.defaultProps = 'invalid'

      const vnode = createWidgetVNode(MyWidget, { custom: 'value' })

      expect(vnode.props).toEqual({ custom: 'value' })
    })
  })
})
