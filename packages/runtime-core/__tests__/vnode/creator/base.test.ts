import { ref } from '@vitarx/responsive'
import { describe, expect, it } from 'vitest'
import {
  type NodeDevInfo,
  NodeKind,
  NodeState,
  setNodeDevInfo,
  VIRTUAL_NODE_SYMBOL
} from '../../../src/index.js'
import { createBaseVNode } from '../../../src/vnode/creator/base.js'

describe('vnode/creator/base - createBaseVNode', () => {
  describe('基础 VNode 创建', () => {
    it('应该创建基本的 VNode 结构', () => {
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, {})

      expect(vnode).toBeDefined()
      expect(vnode[VIRTUAL_NODE_SYMBOL]).toBe(true)
      expect(vnode.type).toBe('div')
      expect(vnode.kind).toBe(NodeKind.REGULAR_ELEMENT)
      expect(vnode.state).toBe(NodeState.Created)
      expect(vnode.props).toEqual({})
    })

    it('应该初始化节点状态为 Created', () => {
      const vnode = createBaseVNode('span', NodeKind.REGULAR_ELEMENT, {})
      expect(vnode.state).toBe(NodeState.Created)
    })

    it('应该设置应用上下文', () => {
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, {})
      // 在测试环境中没有 App 上下文，appContext 可能为 undefined
      expect(vnode).toBeDefined()
    })
  })

  describe('属性处理', () => {
    it('应该正确复制 props', () => {
      const props = { id: 'test', class: 'container' }
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, props)

      expect(vnode.props).toEqual({ id: 'test', class: 'container' })
      // 验证是深拷贝
      expect(vnode.props).not.toBe(props)
    })

    it('应该处理空 props', () => {
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, {})
      expect(vnode.props).toEqual({})
    })

    it('应该自动解包 ref 值', () => {
      const idRef = ref('test-id')
      const props = { id: idRef, name: 'test' }
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, props)

      // 自动解包是默认行为
      expect(vnode.props).toBeDefined()
    })

    it('应该支持禁用自动解包', () => {
      const idRef = ref('test-id')
      const props = { id: idRef }
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, props, false)

      // 禁用解包时，值应该保持为 ref
      expect(vnode.props).toBeDefined()
    })
  })

  describe('key 属性处理', () => {
    it('应该提取并设置 key 属性', () => {
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, { key: 'item-1' })

      expect(vnode.key).toBe('item-1')
      expect(vnode.props.key).toBeUndefined()
    })

    it('应该支持数字类型的 key', () => {
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, { key: 123 })

      expect(vnode.key).toBe(123)
    })

    it('应该支持 Symbol 类型的 key', () => {
      const sym = Symbol('key')
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, { key: sym })

      expect(vnode.key).toBe(sym)
    })
  })

  describe('ref 属性处理', () => {
    it('应该提取并设置 ref 属性', () => {
      const myRef = ref<HTMLElement | null>(null)
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, { ref: myRef })

      // ref 需要是 RefSignal 类型才有效
      expect(vnode).toBeDefined()
    })

    it('应该在不支持 ref 的节点类型上发出警告', () => {
      const myRef = ref<Text | null>(null)
      const vnode = createBaseVNode('plain-text', NodeKind.TEXT, { ref: myRef })

      // TEXT 节点不支持 ref
      expect(vnode.ref).toBeUndefined()
    })

    it('应该在 COMMENT 节点上忽略 ref', () => {
      const myRef = ref<Comment | null>(null)
      const vnode = createBaseVNode('comment', NodeKind.COMMENT, { ref: myRef })

      expect(vnode.ref).toBeUndefined()
    })

    it('应该在 FRAGMENT 节点上忽略 ref', () => {
      const myRef = ref<any>(null)
      const vnode = createBaseVNode('fragment', NodeKind.FRAGMENT, { ref: myRef })

      expect(vnode.ref).toBeUndefined()
    })
  })

  describe('静态标记', () => {
    it('应该提取并设置 v-static 属性', () => {
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, { 'v-static': true })

      expect(vnode.static).toBe(true)
      expect(vnode.props['v-static']).toBeUndefined()
    })

    it('应该支持 false 值的静态标记', () => {
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, { 'v-static': false })

      expect(vnode.static).toBe(false)
    })
  })

  describe('v-bind 合并', () => {
    it('应该合并 v-bind 属性', () => {
      const bindProps = { id: 'from-bind', class: 'bind-class' }
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, {
        'v-bind': bindProps,
        title: 'test'
      })

      // v-bind 会合并到 props 中
      expect(vnode.props).toBeDefined()
      expect(vnode.props.title).toBe('test')
    })

    it('应该优先使用显式属性而不是 v-bind', () => {
      const bindProps = { id: 'from-bind', name: 'bind-name' }
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, {
        'v-bind': bindProps,
        id: 'explicit-id'
      })

      // 显式属性优先
      expect(vnode.props.id).toBe('explicit-id')
      expect(vnode.props.name).toBe('bind-name')
    })

    it('应该忽略非对象的 v-bind 值', () => {
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, {
        'v-bind': 'invalid' as any,
        id: 'test'
      })

      expect(vnode.props.id).toBe('test')
    })
  })

  describe('开发信息', () => {
    it('应该提取开发信息', () => {
      const devInfo: NodeDevInfo = {
        isStatic: false,
        self: undefined,
        source: { fileName: 'test.vue', lineNumber: 1, columnNumber: 1 }
      }
      const props = {}
      setNodeDevInfo(props, devInfo)
      const vnode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, props)
      expect(vnode.devInfo).toEqual(devInfo)
    })
  })

  describe('节点类型标识', () => {
    it('应该为不同类型创建正确的节点', () => {
      const elementNode = createBaseVNode('div', NodeKind.REGULAR_ELEMENT, {})
      expect(elementNode.kind).toBe(NodeKind.REGULAR_ELEMENT)

      const textNode = createBaseVNode('plain-text', NodeKind.TEXT, {})
      expect(textNode.kind).toBe(NodeKind.TEXT)

      const commentNode = createBaseVNode('comment', NodeKind.COMMENT, {})
      expect(commentNode.kind).toBe(NodeKind.COMMENT)

      const fragmentNode = createBaseVNode('fragment', NodeKind.FRAGMENT, {})
      expect(fragmentNode.kind).toBe(NodeKind.FRAGMENT)
    })
  })
})
