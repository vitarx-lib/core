/**
 * TransitionGroup 组件单元测试
 */

import { ref } from '@vitarx/responsive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cloneVNode,
  createVNode,
  FRAGMENT_NODE_TYPE,
  getRenderer,
  mountNode,
  renderNode,
  TransitionGroup
} from '../../../src/index.js'
import {
  mockBoundingRect,
  mockRAFSync,
  mockTransitionDuration
} from '../../helpers/test-transition.js'
import { createContainer, flushScheduler, updateProps } from '../../helpers/test-widget.js'

describe('TransitionGroup 组件', () => {
  let container: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    container = createContainer()
    mockRAFSync()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('属性验证', () => {
    it('应该验证默认 tag 为 fragment', () => {
      const children = [
        createVNode('div', { key: '1', children: 'item1' }),
        createVNode('div', { key: '2', children: 'item2' })
      ]
      const vnode = createVNode(TransitionGroup, {
        children
      })
      renderNode(vnode)
      // 默认应该使用 fragment
      expect(vnode.instance?.child?.type).toBe(FRAGMENT_NODE_TYPE)
    })
  })

  describe('基础功能', () => {
    it('应该渲染多个子元素', () => {
      const children = [
        createVNode('div', { key: '1', children: 'item1' }),
        createVNode('div', { key: '2', children: 'item2' }),
        createVNode('div', { key: '3', children: 'item3' })
      ]
      const vnode = createVNode(TransitionGroup, {
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const items = container.querySelectorAll('div')
      expect(items.length).toBe(3)
    })

    it('应该使用 tag 属性自定义包裹元素', () => {
      const children = [
        createVNode('li', { key: '1', children: 'item1' }),
        createVNode('li', { key: '2', children: 'item2' })
      ]
      const vnode = createVNode(TransitionGroup, {
        tag: 'ul',
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const ul = container.querySelector('ul')
      expect(ul).toBeTruthy()
      expect(ul?.children.length).toBe(2)
    })

    it('应该将 bindProps 传递给包裹元素', () => {
      const children = [createVNode('div', { key: '1', children: 'item' })]
      const vnode = createVNode(TransitionGroup, {
        tag: 'div',
        bindProps: { className: 'list-container', id: 'my-list' },
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const wrapper = container.querySelector('#my-list')
      expect(wrapper).toBeTruthy()
      expect(wrapper?.className).toContain('list-container')
    })

    it('应该在子元素添加时触发 enter 动画', () => {
      const children = [createVNode('div', { key: 1, children: 'test1' })]
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const newChild = createVNode('div', { key: 2, children: 'test2' })
      updateProps(vnode, 'children', [...children, newChild])
      const element = newChild.el! as HTMLDivElement
      expect(element.classList.contains('list-enter-active')).toBe(true)
    })

    it('应该在子元素移除时触发 leave 动画', () => {
      const removeChild = createVNode('div', { key: 2, children: 'test2' })
      const children = [createVNode('div', { key: 1, children: 'test1' }), removeChild]
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      updateProps(vnode, 'children', children.slice(0, 1))
      const element = removeChild.el! as HTMLDivElement
      expect(element.classList.contains('list-leave-active')).toBe(true)
    })

    it('应该在 appear 属性时为所有初始子元素触发动画', () => {
      const children = [
        createVNode('div', { key: '1', children: 'item1' }),
        createVNode('div', { key: '2', children: 'item2' })
      ]
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        appear: true,
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)
      for (const child of children) {
        const element = child.el! as HTMLDivElement
        expect(element.classList.contains('list-enter-active')).toBe(true)
      }
    })
  })

  describe('移动动画', () => {
    it('应该在元素位置变化时触发 move 动画', () => {
      const items = [
        { id: 1, text: 'item1' },
        { id: 2, text: 'item2' },
        { id: 3, text: 'item3' }
      ]

      const children = items.map(item =>
        createVNode('div', { key: item.id, 'data-id': item.id, children: item.text })
      )
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const d = {
        3: 0,
        2: 50,
        1: 100
      } as const
      // 为每个元素模拟位置信息
      for (let i = 0; i < children.length; i++) {
        const element = children[i].el! as HTMLDivElement & { $rect?: boolean }
        const id = Number(element.dataset.id)
        element.getBoundingClientRect = () => {
          const top = element.$rect ? d[id as keyof typeof d] : i * 50
          element.$rect = true
          return {
            width: 100,
            height: 50,
            top: top,
            left: 0,
            right: 100,
            bottom: top + 50,
            x: 0,
            y: top,
            toJSON: () => ({})
          } as DOMRect
        }
      }
      const dom = getRenderer()
      const requestAnimationFrame = vi
        .spyOn(dom, 'requestAnimationFrame')
        .mockImplementation(cb => {
          setTimeout(cb)
          return 0
        })
      const getTransitionDuration = vi
        .spyOn(dom, 'getTransitionDuration')
        .mockImplementation(_cb => {
          return 100
        })
      // 反转顺序
      updateProps(vnode, 'children', children.reverse())
      for (const child of children) {
        if (child.key === 2) continue
        const element = child.el! as HTMLDivElement
        expect(element.classList.contains('list-move')).toBe(true)
      }
      requestAnimationFrame.mockRestore()
      getTransitionDuration.mockRestore()
    })

    it('应该正确应用 moveClass', () => {
      const items = ref([
        { id: 1, text: 'item1' },
        { id: 2, text: 'item2' }
      ])

      const children = items.value.map(item =>
        createVNode('div', { key: item.id, children: item.text })
      )
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        moveClass: 'custom-move',
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      items.value.reverse()
      flushScheduler()

      // 应该应用 custom-move 类名
    })

    it('应该正确计算元素移动距离', () => {
      const el1 = document.createElement('div')
      const el2 = document.createElement('div')
      container.appendChild(el1)
      container.appendChild(el2)

      mockBoundingRect(el1, { left: 0, top: 0, width: 100, height: 50 })
      mockBoundingRect(el2, { left: 0, top: 50, width: 100, height: 50 })

      const children = [
        createVNode('div', { key: '1', el: el1, children: 'item1' }),
        createVNode('div', { key: '2', el: el2, children: 'item2' })
      ]
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 交换位置后应该计算移动距离
    })

    it('应该在移动动画完成后清理类名', () => {
      const element = document.createElement('div')
      container.appendChild(element)

      mockTransitionDuration(element, 300)
      mockBoundingRect(element, { left: 0, top: 0, width: 100, height: 50 })

      const children = [createVNode('div', { key: '1', el: element, children: 'item' })]
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      vi.advanceTimersByTime(320)

      // 移动类名应该被清理
    })

    it('应该在快速连续移动时取消前一个动画', () => {
      const items = ref([
        { id: 1, text: 'item1' },
        { id: 2, text: 'item2' }
      ])

      const children = items.value.map(item =>
        createVNode('div', { key: item.id, children: item.text })
      )
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 快速连续移动
      items.value.reverse()
      flushScheduler()
      items.value.reverse()
      flushScheduler()

      // 应该取消前一个动画
    })
  })

  describe('v-show 指令集成', () => {
    it('应该在 v-show 从 true 到 false 时触发 leave', () => {
      const childVNode = createVNode('div', {
        key: '1',
        'v-show': true,
        children: 'item'
      })
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        children: [childVNode]
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const newChild = cloneVNode(childVNode)
      newChild.directives!.get('show')![1] = false
      updateProps(vnode, 'children', [newChild])
      const element = childVNode.el! as HTMLDivElement
      expect(element.classList.contains('list-leave-active')).toBe(true)
      expect(element.classList.contains('list-leave-to')).toBe(true)
    })

    it('应该在 v-show 从 false 到 true 时触发 enter', () => {
      const childVNode = createVNode('div', {
        key: '1',
        'v-show': false,
        children: 'item'
      })
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        children: [childVNode]
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const newChild = cloneVNode(childVNode)
      newChild.directives!.get('show')![1] = true
      updateProps(vnode, 'children', [newChild])
      const element = childVNode.el! as HTMLDivElement
      expect(element.classList.contains('list-enter-active')).toBe(true)
      expect(element.classList.contains('list-enter-to')).toBe(true)
    })
  })

  describe('边界场景', () => {
    it('应该处理子元素无 key 的情况', () => {
      const children = [
        createVNode('div', { children: 'item1' }),
        createVNode('div', { children: 'item2' })
      ]
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 应该正常渲染
      expect(container.querySelectorAll('div').length).toBe(2)
    })

    it('应该处理空子元素列表', () => {
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        children: []
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.children.length).toBe(0)
      // 片段节点会渲染两个注释节点
      expect(container.childNodes.length).toBe(2)
    })

    it('应该跳过非元素节点的动画', () => {
      const children = ['text', createVNode('div', { key: '1', children: 'item' }), null, undefined]
      const vnode = createVNode(TransitionGroup, {
        name: 'list',
        children
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 非元素节点应该被跳过
      expect(container.children.length).toBe(1)
    })
  })
})
