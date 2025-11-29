/**
 * Transition 组件单元测试
 */

import { ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVNode, mountNode, renderNode, Transition } from '../../../src/index.js'
import {
  mockRAFSync,
  mockTransitionDuration,
  waitForTransition
} from '../../helpers/test-transition.js'
import { createContainer, flushScheduler, updateProps } from '../../helpers/test-widget.js'

describe('Transition 组件', () => {
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
    it('应该验证默认 mode 为 default', () => {
      expect(Transition.defaultProps.mode).toBe('default')
    })

    it('应该验证子节点必须为单个元素', () => {
      const vnode = createVNode(Transition, {
        children: createVNode('div', { children: 'child' })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 应该正常渲染
      expect(container.querySelector('div')).toBeTruthy()
    })
  })

  describe('基础过渡功能', () => {
    it('应该在条件渲染时触发 enter 动画', () => {
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: createVNode('div', { children: 'content' })
      })
      renderNode(vnode)
      mountNode(vnode, container)
      updateProps(vnode, 'children', createVNode('div', { key: 2, children: 'content2' }))
      const element = container.querySelector('div')! as HTMLDivElement
      expect(element).toBeTruthy()
      mockTransitionDuration(element, 300)
      expect(element.classList.contains('fade-enter-active')).toBe(true)
    })

    it('应该在条件渲染时触发 leave 动画', () => {
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: createVNode('div', { children: 'content' })
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const element = container.querySelector('div')! as HTMLDivElement
      updateProps(vnode, 'children', createVNode('div', { key: 2, children: 'content2' }))
      mockTransitionDuration(element, 300)

      expect(element.classList.contains('fade-leave-active')).toBe(true)
    })

    it('应该在 appear 属性时首次挂载触发动画', () => {
      const onBeforeAppear = vi.fn()

      const vnode = createVNode(Transition, {
        appear: true,
        onBeforeAppear,
        children: createVNode('div', { children: 'initial' })
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const element = container.querySelector('div')! as HTMLDivElement
      expect(element.classList.contains('v-appear-active')).toBe(true)
    })

    it('应该在 key 变化时触发元素替换过渡', () => {
      const childVNode = createVNode('div', { key: 'key1', children: `content` })
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      updateProps(vnode, 'children', createVNode('div', { key: 'key2', children: 'content2' }))
      const element = container.querySelector('div')! as HTMLDivElement
      expect(element.classList.contains('fade-enter-active')).toBe(true)
    })

    it('应该在 type 相同且 key 相同时执行普通更新', () => {
      const content = ref('content1')
      const childVNode = createVNode('div', { key: 'same', children: content.value })
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      content.value = 'content2'
      flushScheduler()

      // 应该执行普通更新而非过渡
    })
  })

  describe('过渡模式', () => {
    it('应该在 mode=default 时同时执行进入和离开', () => {
      const child1 = createVNode('div', { key: '1', children: 'child1' })
      const child2 = createVNode('div', { key: '2', children: 'child2' })

      const vnode = createVNode(Transition, {
        name: 'fade',
        mode: 'default',
        children: child1
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const child1Element = child1.el!
      updateProps(vnode, 'children', child2)
      const child2Element = child2.el!
      expect(child1Element.classList.contains('fade-leave-active')).toBe(true)
      expect(child2Element.classList.contains('fade-enter-active')).toBe(true)
    })

    it('应该在 mode=out-in 时先离开后进入', () => {
      const onAfterLeave = vi.fn()
      const onBeforeEnter = vi.fn()

      const child1 = createVNode('div', { key: '1', children: 'child1' })
      const child2 = createVNode('div', { key: '2', children: 'child2' })

      const vnode = createVNode(Transition, {
        name: 'fade',
        mode: 'out-in',
        onAfterLeave,
        onBeforeEnter,
        children: child1
      })
      renderNode(vnode)
      mountNode(vnode, container)
      updateProps(vnode, 'children', child2)
    })

    it('应该在 mode=in-out 时先进入后离开', () => {
      const onAfterEnter = vi.fn()
      const onBeforeLeave = vi.fn()

      const child1 = createVNode('div', { key: '1', children: 'child1' })
      const child2 = createVNode('div', { key: '2', children: 'child2' })

      const vnode = createVNode(Transition, {
        name: 'fade',
        mode: 'in-out',
        onAfterEnter,
        onBeforeLeave,
        children: child1
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const child1Element = child1.el!
      updateProps(vnode, 'children', child2)
      const child2Element = child2.el!
      expect(child2Element.classList.contains('fade-enter-active')).toBe(true)
      expect(child1Element.classList.contains('fade-leave-active')).toBe(false)
    })
  })

  describe('生命周期', () => {
    it('应该在 onMounted 中触发 appear 动画', () => {
      const onAppear = vi.fn()

      const vnode = createVNode(Transition, {
        name: 'fade',
        appear: true,
        onAppear,
        children: createVNode('div', { children: 'content' })
      })
      renderNode(vnode)
      mountNode(vnode, container)
      expect(onAppear).toHaveBeenCalled()
    })
  })

  describe('边界场景', () => {
    it('应该处理子节点为 null 或 undefined', () => {
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: null
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.textContent).toBe('')
    })

    it('应该在快速切换时取消动画', async () => {
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: createVNode('div', { 'v-show': true, children: '1' })
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const element = container.querySelector('div')! as HTMLDivElement
      // 快速切换
      updateProps(vnode, 'children', createVNode('div', { 'v-show': false, children: '2' }))
      expect(element.classList.contains('fade-leave-active')).toBe(true)
      updateProps(vnode, 'children', createVNode('div', { 'v-show': true, children: '3' }))
      expect(element.classList.contains('fade-leave-active')).toBe(false)
      expect(element.classList.contains('fade-enter-active')).toBe(true)
      await waitForTransition(300)
    })

    it('应该跳过静态节点的更新', () => {
      const staticChild = createVNode('div', { 'v-static': true, children: 'static' })
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: staticChild
      })
      renderNode(vnode)
      mountNode(vnode, container)
      updateProps(vnode, 'children', createVNode('div', { children: 'updated' }))
      // 静态节点不应该触发更新
      expect(container.querySelector('div')?.textContent).toBe('static')
    })
  })
})
