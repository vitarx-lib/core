/**
 * PropBind 组件单元测试
 */

import { ref } from '@vitarx/responsive'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createVNode,
  FRAGMENT_NODE_TYPE,
  type FragmentNode,
  mountNode,
  PropBind,
  renderNode
} from '../../../src/index.js'
import { createContainer } from '../../helpers/test-widget.js'

describe('PropBind 组件', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createContainer()
  })

  describe('基础功能', () => {
    it('应该绑定属性到单个子节点', () => {
      const vnode = createVNode(PropBind, {
        color: 'red',
        size: 'large',
        children: createVNode('div', { children: 'content' })
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const childVNode = (vnode.instance!.child as FragmentNode).children[0]
      expect(childVNode.props.color).toBe('red')
      expect(childVNode.props.size).toBe('large')
    })

    it('应该绑定属性到多个子节点', () => {
      const vnode = createVNode(PropBind, {
        color: 'blue',
        children: [
          createVNode('div', { children: 'child1' }),
          createVNode('span', { children: 'child2' }),
          createVNode('p', { children: 'child3' })
        ]
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const children = (vnode.instance!.child as FragmentNode).children
      expect(children[0].props.color).toBe('blue')
      expect(children[1].props.color).toBe('blue')
      expect(children[2].props.color).toBe('blue')
    })

    it('应该绑定属性到数组形式的 children', () => {
      const childNodes = [
        createVNode('div', { children: 'A' }),
        createVNode('div', { children: 'B' })
      ]
      const vnode = createVNode(PropBind, {
        className: 'bound',
        children: childNodes
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const children = (vnode.instance!.child as FragmentNode).children
      expect(children[0].props.className).toBe('bound')
      expect(children[1].props.className).toBe('bound')
    })

    it('应该保留子节点原有属性', () => {
      const vnode = createVNode(PropBind, {
        color: 'green',
        children: createVNode('div', { id: 'test', title: 'original', children: 'content' })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const childVNode = (vnode.instance!.child as FragmentNode).children[0]
      expect(childVNode.props.id).toBe('test')
      expect(childVNode.props.title).toBe('original')
      expect(childVNode.props.color).toBe('green')
    })

    it('应该不覆盖子节点同名属性', () => {
      const vnode = createVNode(PropBind, {
        color: 'red',
        children: createVNode('div', { color: 'blue', children: 'content' })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const childVNode = (vnode.instance!.child as FragmentNode).children[0]
      expect(childVNode.props.color).toBe('blue')
    })

    it('应该返回 Fragment 包裹子节点', () => {
      const vnode = createVNode(PropBind, {
        test: 'value',
        children: createVNode('div', { children: 'content' })
      })
      renderNode(vnode)

      expect((vnode.instance!.child as FragmentNode).children).toBeDefined()
      expect(vnode.instance!.child.type).toBe(FRAGMENT_NODE_TYPE)
    })
  })

  describe('属性绑定行为', () => {
    it('应该跳过非 VNode 子节点', () => {
      const vnode = createVNode(PropBind, {
        color: 'red',
        children: ['text', null, undefined, createVNode('div', { children: 'vnode' })]
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const children = (vnode.instance!.child as FragmentNode).children
      // 只有 VNode 应该有 props.color
      expect(children[1].props.color).toBe('red')
    })

    it('应该支持展开对象属性绑定', () => {
      const bindProps = {
        color: 'red',
        size: 'large',
        disabled: true
      }
      const vnode = createVNode(PropBind, {
        ...bindProps,
        children: createVNode('button', { children: 'Click' })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const childVNode = (vnode.instance!.child as FragmentNode).children[0]
      expect(childVNode.props.color).toBe('red')
      expect(childVNode.props.size).toBe('large')
      expect(childVNode.props.disabled).toBe(true)
    })

    it('应该绑定响应式属性', () => {
      const color = ref('red')
      const vnode = createVNode(PropBind, {
        color,
        children: createVNode('div', { children: 'content' })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const childVNode = (vnode.instance!.child as FragmentNode).children[0]
      expect(childVNode.props.color).toBe(color.value)
    })

    it('应该同时绑定多个属性', () => {
      const vnode = createVNode(PropBind, {
        color: 'red',
        size: 'large',
        disabled: true,
        className: 'test',
        style: { margin: '10px' },
        children: createVNode('div', { children: 'content' })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const childVNode = (vnode.instance!.child as FragmentNode).children[0]
      expect(childVNode.props.color).toBe('red')
      expect(childVNode.props.size).toBe('large')
      expect(childVNode.props.disabled).toBe(true)
      expect(childVNode.props.className).toBe('test')
      expect(childVNode.props.style).toEqual({ margin: '10px' })
    })
  })

  describe('边界场景', () => {
    it('应该处理空数组 children', () => {
      const vnode = createVNode(PropBind, {
        color: 'red',
        children: []
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const children = (vnode.instance!.child as FragmentNode).children
      expect(children).toEqual([])
    })

    it('应该处理 null 或 undefined children', () => {
      const vnode1 = createVNode(PropBind, {
        color: 'red',
        children: null
      })
      renderNode(vnode1)
      mountNode(vnode1, container)

      const vnode2 = createVNode(PropBind, {
        color: 'red',
        children: undefined
      })
      renderNode(vnode2)
      mountNode(vnode2, container)
      expect((vnode1.instance!.child as FragmentNode).children.length).toBe(0)
    })

    it('应该处理混合 VNode 和非 VNode 子节点', () => {
      const vnode = createVNode(PropBind, {
        color: 'red',
        children: [
          'text',
          createVNode('div', { children: 'vnode1' }),
          42,
          createVNode('span', { children: 'vnode2' }),
          true,
          null
        ]
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const children = (vnode.instance!.child as FragmentNode).children
      // 只有索引 1 和 3 的 VNode 应该有 color 属性
      expect(children[1].props.color).toBe('red')
      expect(children[3].props.color).toBe('red')
      // 其他非 VNode 子节点保持不变
      expect(children[0].props.text).toBe('text')
      expect(children[2].props.text).toBe('42')
      expect(children[4]).toBeUndefined()
      expect(children[5]).toBeUndefined()
    })
  })
})
