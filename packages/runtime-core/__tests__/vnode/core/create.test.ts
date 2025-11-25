/**
 * VNode 创建功能测试
 *
 * 测试 createVNode 函数的各种场景
 */

import { ref } from '@vitarx/responsive'
import { describe, expect, it, vi } from 'vitest'
import {
  COMMENT_NODE_TYPE,
  defineStatelessWidget,
  DYNAMIC_RENDER_TYPE,
  FRAGMENT_NODE_TYPE,
  NodeKind,
  TEXT_NODE_TYPE,
  type VoidElementVNodeType
} from '../../../src/index.js'
import { createVNode, h } from '../../../src/vnode/core/create.js'
import { createTestWidget } from '../../helpers/test-widget.js'

describe('VNode 创建 (createVNode)', () => {
  describe('基础节点创建', () => {
    it('应该能够创建文本节点', () => {
      const vnode = createVNode(TEXT_NODE_TYPE, { value: 'Hello World' })

      expect(vnode.type).toBe(TEXT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.TEXT)
      expect(vnode.props.value).toBe('Hello World')
    })

    it('应该能够创建空文本节点', () => {
      const vnode = createVNode(TEXT_NODE_TYPE, { value: '' })

      expect(vnode.props.value).toBe('')
    })

    it('应该能够创建特殊字符文本节点', () => {
      const specialText = '<div>特殊字符&nbsp;</div>'
      const vnode = createVNode(TEXT_NODE_TYPE, { value: specialText })

      expect(vnode.props.value).toBe(specialText)
    })

    it('应该能够创建注释节点', () => {
      const vnode = createVNode(COMMENT_NODE_TYPE, { value: 'This is a comment' })

      expect(vnode.type).toBe(COMMENT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.COMMENT)
      expect(vnode.props.value).toBe('This is a comment')
    })

    it('应该能够创建 Fragment 节点', () => {
      const children = [
        createVNode(TEXT_NODE_TYPE, { value: 'child1' }),
        createVNode(TEXT_NODE_TYPE, { value: 'child2' })
      ]
      const vnode = createVNode(FRAGMENT_NODE_TYPE, { children })

      expect(vnode.type).toBe(FRAGMENT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.FRAGMENT)
      expect(vnode.children).toHaveLength(2)
    })

    it('应该能够创建空 Fragment', () => {
      const vnode = createVNode(FRAGMENT_NODE_TYPE, {})

      expect(vnode.kind).toBe(NodeKind.FRAGMENT)
      expect(vnode.children).toHaveLength(0)
    })
  })

  describe('元素节点创建', () => {
    it('应该能够创建常规元素节点', () => {
      const vnode = createVNode('div', { id: 'test', class: 'container' })

      expect(vnode.type).toBe('div')
      expect(vnode.kind).toBe(NodeKind.REGULAR_ELEMENT)
      expect(vnode.props.id).toBe('test')
      // class 被规范化为数组
      expect(vnode.props.class).toEqual(['container'])
    })

    it('应该能够验证属性传递', () => {
      const props = {
        id: 'test-id',
        class: 'test-class',
        style: { color: 'red' },
        onClick: vi.fn()
      }
      const vnode = createVNode('button', props)

      expect(vnode.props.id).toBe('test-id')
      // class 被规范化为数组
      expect(vnode.props.class).toEqual(['test-class'])
      expect(vnode.props.style).toEqual({ color: 'red' })
      expect(vnode.props.onClick).toBe(props.onClick)
    })

    it('应该能够验证子节点绑定', () => {
      const children = [createVNode(TEXT_NODE_TYPE, { value: 'text' })]
      const vnode = createVNode('div', { children })

      expect(vnode.children).toHaveLength(1)
      expect(vnode.children[0].type).toBe(TEXT_NODE_TYPE)
    })

    it('应该能够创建自闭合元素节点', () => {
      const vnode = createVNode('img', { src: 'test.jpg', alt: 'test' })

      expect(vnode.type).toBe('img')
      expect(vnode.kind).toBe(NodeKind.VOID_ELEMENT)
      expect(vnode.props.src).toBe('test.jpg')
    })

    it('应该验证 void 元素类型', () => {
      const voidElements: VoidElementVNodeType[] = ['img', 'input', 'br', 'hr']

      voidElements.forEach(tag => {
        const vnode = createVNode(tag)
        expect(vnode.kind).toBe(NodeKind.VOID_ELEMENT)
      })
    })
  })

  describe('Widget 节点创建', () => {
    it('应该能够创建 StatefulWidget 节点', () => {
      const TestWidget = createTestWidget()
      const vnode = createVNode(TestWidget, { name: 'test' })

      expect(vnode.type).toBe(TestWidget)
      expect(vnode.kind).toBe(NodeKind.STATEFUL_WIDGET)
      expect(vnode.props.name).toBe('test')
    })

    it('应该验证 Widget props 传递', () => {
      const TestWidget = createTestWidget()
      const props = { id: 'widget-1', count: 10 }
      const vnode = createVNode(TestWidget, props)

      expect(vnode.props.id).toBe('widget-1')
      expect(vnode.props.count).toBe(10)
    })

    it('应该能够创建 StatelessWidget 节点', () => {
      const TestFnWidget = defineStatelessWidget(() => {
        return null
      })
      const vnode = createVNode(TestFnWidget, { title: ref('test') })

      expect(vnode.type).toBe(TestFnWidget)
      expect(vnode.kind).toBe(NodeKind.STATELESS_WIDGET)
      expect(vnode.props.title).toBe('test')
    })
  })

  describe('动态节点创建', () => {
    it('应该能够创建动态组件节点', () => {
      const TestWidget = createTestWidget()
      const vnode = createVNode(DYNAMIC_RENDER_TYPE, { is: TestWidget })

      expect(vnode.type).toBe(TestWidget)
      expect(vnode.kind).toBe(NodeKind.STATEFUL_WIDGET)
    })

    it('应该验证 ref 解包', () => {
      const TestWidget = createTestWidget()
      const widgetRef = ref(TestWidget)
      const vnode = createVNode(DYNAMIC_RENDER_TYPE, { is: widgetRef })

      expect(vnode.type).toBe(TestWidget)
    })

    it('应该在动态组件缺少 is 属性时抛出错误', () => {
      expect(() => {
        createVNode(DYNAMIC_RENDER_TYPE, {})
      }).toThrow('dynamic render "is" prop is mandatory and cannot be empty')
    })
  })

  describe('边界和异常测试', () => {
    it('应该在传入无效节点类型时抛出错误', () => {
      expect(() => {
        createVNode(123 as any, {})
      }).toThrow('createVNode(): invalid node type')
    })

    it('应该在传入 null 作为类型时抛出错误', () => {
      expect(() => {
        createVNode(null as any, {})
      }).toThrow()
    })
  })

  describe('h 函数别名', () => {
    it('h 应该是 createVNode 的别名', () => {
      expect(h).toBe(createVNode)
    })

    it('应该能够通过 h 创建节点', () => {
      const vnode = h('div', { id: 'test' })

      expect(vnode.type).toBe('div')
      expect(vnode.props.id).toBe('test')
    })
  })

  describe('v-bind 特殊指令', () => {
    it('应该能够处理 v-bind 指令', () => {
      const vnode = createVNode('div', { 'v-bind': { id: 'test' } })
      expect(vnode.props.id).toBe('test')
    })
    it('应该能够处理 v-bind 指令的数组形式', () => {
      const vnode = createVNode('div', { 'v-bind': [{ id: 'test' }] })
      expect(vnode.props.id).toBe('test')
    })
    it('应该能够处理 v-bind 指令的数组形式排除特定特定属性', () => {
      const vnode = createVNode('div', {
        'v-bind': [{ id: 'test', class: 'container' }, ['class']]
      })
      expect(vnode.props.class).toBeUndefined()
    })
  })
})
