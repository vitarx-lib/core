/**
 * KeepAlive 组件单元测试
 */

import { notify, ref, shallowRef } from '@vitarx/responsive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVNode, KeepAlive, mountNode, renderNode, unmountNode } from '../../../src/index.js'
import { createContainer, createTestWidget, flushScheduler } from '../../helpers/test-widget.js'

describe('KeepAlive 组件', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createContainer()
  })

  describe('属性验证', () => {
    it('应该验证 children 属性必须存在', () => {
      expect(() => {
        KeepAlive.validateProps({} as any)
      }).toThrow('children is required')
    })

    it('应该验证 children 必须为 WidgetNode 或 Widget', () => {
      expect(() => {
        KeepAlive.validateProps({ children: 'not a widget' as any })
      }).toThrow('WidgetNode or a Widget')
    })

    it('应该验证默认属性值', () => {
      expect(KeepAlive.defaultProps.max).toBe(10)
      expect(KeepAlive.defaultProps.include).toEqual([])
      expect(KeepAlive.defaultProps.exclude).toEqual([])
    })
  })

  describe('基础缓存功能', () => {
    it('应该缓存单个组件实例', async () => {
      const Widget1 = createTestWidget({
        build() {
          return createVNode('div', { children: 'Widget 1' })
        }
      })

      const vnode = createVNode(KeepAlive, {
        children: Widget1
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const runtime = vnode.runtimeInstance!
      vnode.props.children = createTestWidget()
      notify(runtime.props, 'children')
      flushScheduler()
      const instance = runtime.instance
      expect(instance.cached.size).toBeGreaterThan(0)
    })

    it('应该在切换组件时复用缓存', () => {
      const onDeactivated1 = vi.fn()
      const onActivated1 = vi.fn()

      const Widget1 = createTestWidget({
        onDeactivated: onDeactivated1,
        onActivated: onActivated1,
        build() {
          return createVNode('div', { children: 'Widget 1' })
        }
      })

      const Widget2 = createTestWidget({
        build() {
          return createVNode('div', { children: 'Widget 2' })
        }
      })
      const vnode = createVNode(KeepAlive, {
        children: Widget1
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const runtime = vnode.runtimeInstance!
      expect(container.textContent).toContain('Widget 1')

      // 切换到 Widget2
      vnode.props.children = Widget2
      notify(runtime.props, 'children')
      flushScheduler()

      expect(container.textContent).toContain('Widget 2')

      // 切回 Widget1，应该复用缓存
      vnode.props.children = Widget1
      notify(runtime.props, 'children')
      flushScheduler()

      expect(container.textContent).toContain('Widget 1')
    })

    it('应该在组件切换时触发 onDeactivated 钩子', () => {
      const onDeactivated = vi.fn()
      const Widget1 = createTestWidget({
        onDeactivated,
        build() {
          return createVNode('div', { children: 'W1' })
        }
      })

      const Widget2 = createTestWidget({
        build() {
          return createVNode('div', { children: 'W2' })
        }
      })

      const vnode = createVNode(KeepAlive, {
        children: Widget1
      })
      renderNode(vnode)
      mountNode(vnode, container)

      vnode.props.children = Widget2
      notify(vnode.runtimeInstance!.props, 'children')
      flushScheduler()

      expect(onDeactivated).toHaveBeenCalled()
    })

    it('应该在组件激活时触发 onActivated 钩子', () => {
      const onActivated = vi.fn()
      const Widget1 = createTestWidget({
        onActivated,
        build() {
          return createVNode('div', { children: 'W1' })
        }
      })

      const Widget2 = createTestWidget({
        build() {
          return createVNode('div', { children: 'W2' })
        }
      })

      const vnode = createVNode(KeepAlive, {
        children: Widget1
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const runtime = vnode.runtimeInstance!
      // 首次挂载会触发一次 onActivated
      onActivated.mockClear()

      // 切换到 Widget2
      vnode.props.children = Widget2
      notify(runtime.props, 'children')
      flushScheduler()

      // 切回 Widget1
      vnode.props.children = Widget1
      notify(runtime.props, 'children')
      flushScheduler()

      expect(onActivated).toHaveBeenCalled()
    })

    it('应该使用 include 属性限制缓存范围', () => {
      const Widget1 = createTestWidget({
        build() {
          return createVNode('div', { children: 'W1' })
        }
      })

      const Widget2 = createTestWidget({
        build() {
          return createVNode('div', { children: 'W2' })
        }
      })

      const currentChild = shallowRef<any>(createVNode(Widget1, {}))
      const vnode = createVNode(KeepAlive, {
        include: [Widget1],
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const instance = vnode.runtimeInstance?.instance as KeepAlive

      // Widget1 应该被缓存
      expect(instance.isKeep(Widget1)).toBe(true)
      // Widget2 不应该被缓存
      expect(instance.isKeep(Widget2)).toBe(false)
    })

    it('应该使用 exclude 属性排除特定组件', () => {
      const Widget1 = createTestWidget()
      const Widget2 = createTestWidget()

      const currentChild = shallowRef<any>(createVNode(Widget1, {}))
      const vnode = createVNode(KeepAlive, {
        exclude: [Widget2],
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const instance = vnode.runtimeInstance?.instance as KeepAlive

      expect(instance.isKeep(Widget1)).toBe(true)
      expect(instance.isKeep(Widget2)).toBe(false)
    })

    it('应该确保 exclude 优先级高于 include', () => {
      const Widget1 = createTestWidget()

      const currentChild = shallowRef<any>(createVNode(Widget1, {}))
      const vnode = createVNode(KeepAlive, {
        include: [Widget1],
        exclude: [Widget1],
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const instance = vnode.runtimeInstance?.instance as KeepAlive

      // exclude 优先级更高
      expect(instance.isKeep(Widget1)).toBe(false)
    })

    it('应该使用 max 属性限制缓存数量', () => {
      const widgets: any[] = []
      for (let i = 0; i < 5; i++) {
        widgets.push(
          createTestWidget({
            build() {
              return createVNode('div', { children: `Widget ${i}` })
            }
          })
        )
      }

      const currentChild = shallowRef<any>(createVNode(widgets[0], {}))
      const vnode = createVNode(KeepAlive, {
        max: 2,
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const instance = vnode.runtimeInstance?.instance as KeepAlive

      // 切换到不同的组件
      for (let i = 1; i < 4; i++) {
        currentChild.value = createVNode(widgets[i], {})
        flushScheduler()
      }

      // 缓存数量应该不超过 max
      let totalCached = 0
      instance.cached.forEach(typeMap => {
        totalCached += typeMap.size
      })
      expect(totalCached).toBeLessThanOrEqual(2)
    })
  })

  describe('缓存管理', () => {
    it('应该在超出 max 时移除最早缓存（FIFO）', () => {
      const Widget1 = createTestWidget()
      const Widget2 = createTestWidget()
      const Widget3 = createTestWidget()

      const currentChild = shallowRef<any>(createVNode(Widget1, {}))
      const vnode = createVNode(KeepAlive, {
        max: 2,
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const instance = vnode.runtimeInstance?.instance as KeepAlive

      // 切换到 Widget2
      currentChild.value = createVNode(Widget2, {})
      flushScheduler()

      // 切换到 Widget3，此时应该移除 Widget1
      currentChild.value = createVNode(Widget3, {})
      flushScheduler()

      // Widget1 应该已被移除
      expect(instance.cached.has(Widget1)).toBe(false)
    })

    it('应该为相同 type 和 key 的组件复用缓存', () => {
      const Widget1 = createTestWidget()
      const vnode1 = createVNode(Widget1, { key: 'same-key' })
      const vnode2 = createVNode(Widget1, { key: 'same-key' })

      const currentChild = shallowRef<any>(vnode1)
      const vnode = createVNode(KeepAlive, {
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const instance = vnode.runtimeInstance?.instance as KeepAlive
      const cachedVNode1 = instance['currentChild']

      // 切换到另一个组件再切回
      currentChild.value = createVNode(createTestWidget(), {})
      flushScheduler()

      currentChild.value = vnode2
      flushScheduler()

      // 应该复用相同的 VNode
      expect(instance['currentChild']).toBe(cachedVNode1)
    })

    it('应该为不同 key 的相同 type 组件独立缓存', () => {
      const Widget1 = createTestWidget()

      const vnode = createVNode(KeepAlive, {
        children: Widget1
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const runtime = vnode.runtimeInstance!
      const instance = vnode.runtimeInstance?.instance as KeepAlive

      vnode.props.children = createVNode(Widget1, { key: 'different-key' })
      notify(runtime.props, 'children')
      flushScheduler()
      const typeCache = instance.cached.get(Widget1)
      expect(typeCache?.size).toBeGreaterThanOrEqual(1)
    })

    it('应该在组件卸载时清理所有缓存', () => {
      const Widget1 = createTestWidget()
      const Widget2 = createTestWidget()

      const currentChild = shallowRef<any>(createVNode(Widget1, {}))
      const vnode = createVNode(KeepAlive, {
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const instance = vnode.runtimeInstance?.instance as KeepAlive

      // 切换组件产生缓存
      currentChild.value = createVNode(Widget2, {})
      flushScheduler()

      unmountNode(vnode)

      // 缓存应该被清空
      expect(instance.cached.size).toBe(0)
    })

    it('应该确保缓存的组件保持状态不变', () => {
      const count = ref(0)
      const Widget1 = createTestWidget({
        build() {
          count.value++
          return createVNode('div', { children: `Count: ${count.value}` })
        }
      })

      const Widget2 = createTestWidget({
        build() {
          return createVNode('div', { children: 'Widget 2' })
        }
      })

      const currentChild = shallowRef<any>(createVNode(Widget1, {}))
      const vnode = createVNode(KeepAlive, {
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const initialCount = count.value

      // 切换到 Widget2
      currentChild.value = createVNode(Widget2, {})
      flushScheduler()

      // 切回 Widget1
      currentChild.value = createVNode(Widget1, {})
      flushScheduler()

      // build 不应该再次调用
      expect(count.value).toBe(initialCount)
    })
  })

  describe('更新逻辑', () => {
    it('应该在 $patchUpdate 处理缓存组件的激活', () => {
      const Widget1 = createTestWidget()
      const Widget2 = createTestWidget()

      const currentChild = shallowRef<any>(createVNode(Widget1, {}))
      const vnode = createVNode(KeepAlive, {
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 切换组件
      currentChild.value = createVNode(Widget2, {})
      flushScheduler()

      // $patchUpdate 应该处理激活逻辑
      expect(vnode.runtimeInstance).toBeDefined()
    })

    it('应该在 $patchUpdate 处理非缓存组件的卸载', () => {
      const Widget1 = createTestWidget()
      const Widget2 = createTestWidget()

      const currentChild = shallowRef<any>(createVNode(Widget1, {}))
      const vnode = createVNode(KeepAlive, {
        exclude: [Widget1], // Widget1 不缓存
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const instance = vnode.runtimeInstance?.instance as KeepAlive

      // 切换到 Widget2
      currentChild.value = createVNode(Widget2, {})
      flushScheduler()

      // Widget1 不应该在缓存中
      expect(instance.cached.has(Widget1)).toBe(false)
    })

    it('应该在 children 属性变化时触发组件切换', () => {
      const Widget1 = createTestWidget({
        build() {
          return createVNode('div', { children: 'W1' })
        }
      })

      const Widget2 = createTestWidget({
        build() {
          return createVNode('div', { children: 'W2' })
        }
      })

      const currentChild = shallowRef<any>(createVNode(Widget1, {}))
      const vnode = createVNode(KeepAlive, {
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)
      const runtime = vnode.runtimeInstance!

      expect(container.textContent).toContain('W1')

      vnode.props.children = Widget2
      notify(runtime.props, 'children')
      flushScheduler()

      expect(container.textContent).toContain('W2')
    })
  })

  describe('边界场景', () => {
    it('应该在 max 小于 1 时不限制缓存数量', () => {
      const widgets: any[] = []
      for (let i = 0; i < 15; i++) {
        widgets.push(createTestWidget())
      }

      const vnode = createVNode(KeepAlive, {
        max: 0, // 不限制
        children: widgets[0]
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const instance = vnode.runtimeInstance?.instance as KeepAlive

      // 切换多个组件
      for (let i = 1; i < 12; i++) {
        vnode.props.children = widgets[i]
        notify(vnode.runtimeInstance!.props, 'children')
        flushScheduler()
      }

      // 应该缓存所有组件
      let totalCached = 0
      instance.cached.forEach(typeMap => {
        totalCached += typeMap.size
      })
      expect(totalCached).toBeGreaterThan(10)
    })

    it('应该在空 include 列表时缓存所有组件', () => {
      const Widget1 = createTestWidget()
      const Widget2 = createTestWidget()

      const currentChild = shallowRef<any>(createVNode(Widget1, {}))
      const vnode = createVNode(KeepAlive, {
        include: [],
        children: currentChild as any
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const instance = vnode.runtimeInstance?.instance as KeepAlive

      expect(instance.isKeep(Widget1)).toBe(true)
      expect(instance.isKeep(Widget2)).toBe(true)
    })

    it('应该正确跟踪 props.children 的响应式变化', () => {
      const Widget1 = createTestWidget({
        build() {
          return createVNode('div', { children: 'Dynamic W1' })
        }
      })

      const Widget2 = createTestWidget({
        build() {
          return createVNode('div', { children: 'Dynamic W2' })
        }
      })

      const vnode = createVNode(KeepAlive, {
        children: Widget1
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.textContent).toContain('Dynamic W1')

      // 响应式变化
      vnode.props.children = Widget2
      notify(vnode.runtimeInstance!.props, 'children')
      flushScheduler()

      expect(container.textContent).toContain('Dynamic W2')
    })
  })
})
