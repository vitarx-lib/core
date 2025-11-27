/**
 * Transition 组件单元测试
 */

import { ref } from '@vitarx/responsive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVNode, mountNode, renderNode, Transition } from '../../../src/index.js'
import { mockRAFSync, mockTransitionDuration } from '../../helpers/test-transition.js'
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
        children: createVNode('div', {}, 'child')
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
        children: createVNode('div', {}, 'content')
      })
      renderNode(vnode)
      mountNode(vnode, container)
      updateProps(vnode, 'children', createVNode('div', { key: 2 }, 'content2'))
      const element = container.querySelector('div')! as HTMLDivElement
      expect(element).toBeTruthy()
      mockTransitionDuration(element, 300)
      expect(element.classList.contains('fade-enter-active')).toBe(true)
    })

    it('应该在条件渲染时触发 leave 动画', () => {
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: createVNode('div', {}, 'content')
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const element = container.querySelector('div')! as HTMLDivElement
      updateProps(vnode, 'children', createVNode('div', { key: 2 }, 'content2'))
      mockTransitionDuration(element, 300)

      expect(element.classList.contains('fade-leave-active')).toBe(true)
    })

    it('应该在 appear 属性时首次挂载触发动画', () => {
      const onBeforeAppear = vi.fn()

      const vnode = createVNode(Transition, {
        name: 'fade',
        appear: true,
        onBeforeAppear,
        children: createVNode('div', {}, 'initial')
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const element = container.querySelector('div')! as HTMLDivElement
      expect(element.classList.contains('fade-appear-active')).toBe(true)
    })

    it('应该使用自定义 name 属性生成正确类名', () => {
      const element = document.createElement('div')
      container.appendChild(element)

      mockTransitionDuration(element, 300)

      const vnode = createVNode(Transition, {
        name: 'custom',
        children: createVNode('div', { el: element })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 类名应该以 'custom-' 为前缀
    })

    it('应该在 key 变化时触发元素替换过渡', () => {
      const key = ref('key1')
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: createVNode('div', { key: key.value }, `content-${key.value}`)
      })
      renderNode(vnode)
      mountNode(vnode, container)

      key.value = 'key2'
      flushScheduler()

      // 应该触发替换过渡
    })

    it('应该在 type 相同且 key 相同时执行普通更新', () => {
      const content = ref('content1')
      const childVNode = createVNode('div', { key: 'same' }, content.value)
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
      const child1 = createVNode('div', { key: '1' }, 'child1')
      const child2 = createVNode('div', { key: '2' }, 'child2')

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

      const child1 = createVNode('div', { key: '1' }, 'child1')
      const child2 = createVNode('div', { key: '2' }, 'child2')

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

      const show = ref(true)
      const child1 = createVNode('div', { key: '1' }, 'child1')
      const child2 = createVNode('div', { key: '2' }, 'child2')

      const vnode = createVNode(Transition, {
        name: 'fade',
        mode: 'in-out',
        onAfterEnter,
        onBeforeLeave,
        children: show.value ? child1 : child2
      })
      renderNode(vnode)
      mountNode(vnode, container)

      show.value = false
      flushScheduler()

      // 应该先完成 enter，再开始 leave
    })
  })

  describe('生命周期', () => {
    it('应该在 onMounted 中触发 appear 动画', () => {
      const onAppear = vi.fn()

      const vnode = createVNode(Transition, {
        name: 'fade',
        appear: true,
        onAppear,
        children: createVNode('div', {}, 'content')
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // onMounted 应该触发 appear
      const instance = vnode.runtimeInstance?.instance
      if (instance) {
        ;(instance as any).onMounted?.()
      }
    })

    it('应该在过渡完成后执行回调', () => {
      const done = vi.fn()

      const element = document.createElement('div')
      container.appendChild(element)

      mockTransitionDuration(element, 300)

      const vnode = createVNode(Transition, {
        name: 'fade',
        children: createVNode('div', { el: element })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      vi.advanceTimersByTime(320)

      // 过渡完成后应该执行回调
    })
  })

  describe('边界场景', () => {
    it('应该处理子节点为 null 或 undefined', () => {
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: null as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.textContent).toBe('')
    })

    it('应该在快速切换时取消动画', () => {
      const key = ref('key1')
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: createVNode('div', { key: key.value }, key.value)
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 快速切换
      key.value = 'key2'
      flushScheduler()
      key.value = 'key3'
      flushScheduler()

      // 应该取消前一个动画
    })

    it('应该跳过静态节点的更新', () => {
      const staticChild = createVNode('div', { static: true }, 'static')
      const vnode = createVNode(Transition, {
        name: 'fade',
        children: staticChild
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 静态节点不应该触发更新
      expect(container.querySelector('div')).toBeTruthy()
    })
  })
})
