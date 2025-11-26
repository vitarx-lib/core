/**
 * Widget 基类单元测试
 *
 * 测试 Widget 基类的核心功能和生命周期管理
 */

import { ref } from '@vitarx/responsive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  activateNode,
  createVNode,
  deactivateNode,
  type ErrorInfo,
  mountNode,
  renderNode,
  unmountNode,
  Widget
} from '../../../src/index.js'
import { createContainer, createTestWidget, flushScheduler } from '../../helpers/test-widget.js'

describe('Widget 基类', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createContainer()
  })

  describe('基础功能', () => {
    it('应该正确创建 Widget 实例', () => {
      const TestWidget = createTestWidget()
      const vnode = createVNode(TestWidget, { name: 'test' })
      renderNode(vnode)

      expect(vnode.runtimeInstance).toBeDefined()
      expect(vnode.runtimeInstance!.instance).toBeInstanceOf(Widget)
    })

    it('应该正确访问 props', () => {
      const TestWidget = createTestWidget<{ name: string; age: number }>()
      const vnode = createVNode(TestWidget, { name: 'John', age: ref(30) })
      renderNode(vnode)

      const instance = vnode.runtimeInstance!.instance
      expect(instance.props.name).toBe('John')
      expect(instance.props.age).toBe(30)
    })

    it('应该正确访问 children', () => {
      const TestWidget = createTestWidget<{ children: any }>()
      const child = createVNode('span', {}, 'child')
      const vnode = createVNode(TestWidget, { children: child })
      renderNode(vnode)

      const instance = vnode.runtimeInstance!.instance
      expect(instance.children).toBe(child)
    })

    it('挂载后应该能够访问 $el', () => {
      const TestWidget = createTestWidget()
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      const instance = vnode.runtimeInstance!.instance
      expect(instance.$el).toBeDefined()
      expect(instance.$el).toBeInstanceOf(Element)
    })

    it('应该能够访问 $vnode', () => {
      const TestWidget = createTestWidget()
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)

      const instance = vnode.runtimeInstance!.instance
      expect(instance.$vnode).toBe(vnode)
    })
  })

  describe('生命周期钩子', () => {
    it('应该在实例化时调用 onCreate', () => {
      const onCreate = vi.fn()
      const TestWidget = class extends Widget {
        override onCreate() {
          onCreate()
        }
        build() {
          return createVNode('div')
        }
      }
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)

      expect(onCreate).toHaveBeenCalledTimes(1)
    })

    it('应该在挂载前调用 onBeforeMount', () => {
      const onBeforeMount = vi.fn()
      const TestWidget = createTestWidget({ onBeforeMount })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      expect(onBeforeMount).toHaveBeenCalledTimes(1)
    })

    it('应该在挂载后调用 onMounted', () => {
      const onMounted = vi.fn()
      const TestWidget = createTestWidget({ onMounted })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      expect(onMounted).toHaveBeenCalledTimes(1)
    })

    it('onMounted 应该能够访问 DOM', () => {
      const onMounted = vi.fn(function (this: Widget) {
        expect(this.$el).toBeDefined()
        expect(this.$el).toBeInstanceOf(Element)
      })
      const TestWidget = createTestWidget({ onMounted })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      expect(onMounted).toHaveBeenCalled()
    })

    it('应该在更新前调用 onBeforeUpdate', () => {
      const count = ref(0)
      const onBeforeUpdate = vi.fn()
      const TestWidget = createTestWidget({
        onBeforeUpdate,
        build() {
          return createVNode('div', {}, count.value.toString())
        }
      })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      count.value++
      flushScheduler()

      expect(onBeforeUpdate).toHaveBeenCalled()
    })

    it('应该在更新后调用 onUpdated', () => {
      const count = ref(0)
      const onUpdated = vi.fn()
      const TestWidget = createTestWidget({
        onUpdated,
        build() {
          return createVNode('div', {}, count.value.toString())
        }
      })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      count.value++
      flushScheduler()

      expect(onUpdated).toHaveBeenCalled()
    })

    it('应该在卸载前调用 onBeforeUnmount', () => {
      const onBeforeUnmount = vi.fn()
      const TestWidget = createTestWidget({ onBeforeUnmount })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      unmountNode(vnode)

      expect(onBeforeUnmount).toHaveBeenCalledTimes(1)
    })

    it('应该在卸载后调用 onUnmounted', () => {
      const onUnmounted = vi.fn()
      const TestWidget = createTestWidget({ onUnmounted })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      unmountNode(vnode)

      expect(onUnmounted).toHaveBeenCalledTimes(1)
    })

    it('应该在激活时调用 onActivated', () => {
      const onActivated = vi.fn()
      const TestWidget = createTestWidget({ onActivated })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      // 先停用再激活
      deactivateNode(vnode, true)
      activateNode(vnode)

      // 注意：首次挂载时会调用一次activated，所以总共2次
      expect(onActivated).toHaveBeenCalled()
    })

    it('应该在停用时调用 onDeactivated', () => {
      const onDeactivated = vi.fn()
      const TestWidget = createTestWidget({ onDeactivated })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      deactivateNode(vnode, true)

      expect(onDeactivated).toHaveBeenCalledTimes(1)
    })

    it('生命周期钩子应该按正确顺序调用', () => {
      const calls: string[] = []
      const TestWidget = class extends Widget {
        override onCreate() {
          calls.push('onCreate')
        }
        override onBeforeMount() {
          calls.push('onBeforeMount')
        }
        override onMounted() {
          calls.push('onMounted')
        }
        build() {
          return createVNode('div')
        }
      }
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      expect(calls).toEqual(['onCreate', 'onBeforeMount', 'onMounted'])
    })
  })

  describe('错误处理', () => {
    it('应该在子组件抛出错误时调用 onError', () => {
      const onError = vi.fn((error: unknown, info: ErrorInfo): false => {
        expect(error).toBeInstanceOf(Error)
        expect(info.source).toBe('build')
        return false
      })

      const TestWidget = createTestWidget({ onError })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)

      // 直接调用 reportError 测试
      vnode.runtimeInstance!.reportError(new Error('Test error'), 'build')

      expect(onError).toHaveBeenCalled()
    })

    it('onError 返回 VNode 应该渲染备用 UI', () => {
      const fallbackVNode = createVNode('div', {}, 'Error occurred')
      const onError = vi.fn(() => fallbackVNode)

      const TestWidget = createTestWidget({ onError })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)

      const result = vnode.runtimeInstance!.reportError(new Error('Test'), 'build')
      expect(result).toBe(fallbackVNode)
    })

    it('onError 返回 false 应该停止错误冒泡', () => {
      const onError = vi.fn(() => false)

      const TestWidget = createTestWidget({ onError })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)

      const result = vnode.runtimeInstance!.reportError(new Error('Test'), 'build')
      expect(result).toBeUndefined()
      expect(onError).toHaveBeenCalled()
    })

    it('onRender 返回 Promise 应该正确处理', async () => {
      const onRender = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      const TestWidget = createTestWidget({ onRender })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)

      expect(onRender).toHaveBeenCalled()
    })
  })

  describe('更新机制', () => {
    it('$forceUpdate(true) 应该同步触发更新', () => {
      const buildSpy = vi.fn(() => createVNode('div', {}, 'updated'))
      const TestWidget = createTestWidget({ build: buildSpy })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      buildSpy.mockClear()
      vnode.runtimeInstance!.instance.$forceUpdate(true)

      expect(buildSpy).toHaveBeenCalled()
    })

    it('$forceUpdate(false) 应该异步触发更新', () => {
      const buildSpy = vi.fn(() => createVNode('div', {}, 'updated'))
      const TestWidget = createTestWidget({ build: buildSpy })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      buildSpy.mockClear()
      vnode.runtimeInstance!.instance.$forceUpdate(false)

      // 异步更新，立即检查不应该被调用
      expect(buildSpy).not.toHaveBeenCalled()

      flushScheduler()
      expect(buildSpy).toHaveBeenCalled()
    })

    it('build 方法应该在组件更新时被调用', () => {
      const count = ref(0)
      const buildSpy = vi.fn(() => createVNode('div', {}, count.value.toString()))
      const TestWidget = createTestWidget({ build: buildSpy })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      buildSpy.mockClear()
      count.value++
      flushScheduler()

      expect(buildSpy).toHaveBeenCalled()
    })

    it('build 返回 VNode 应该正确渲染', () => {
      const TestWidget = createTestWidget({
        build() {
          return createVNode('div', {}, 'Hello')
        }
      })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.textContent).toBe('Hello')
    })

    it('build 返回字符串应该正确渲染', () => {
      const TestWidget = class extends Widget {
        build() {
          return 'Hello String'
        }
      }
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.textContent).toBe('Hello String')
    })

    it('build 返回数字应该正确渲染', () => {
      const TestWidget = class extends Widget {
        build() {
          return 42
        }
      }
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.textContent).toBe('42')
    })
  })

  describe('自定义补丁更新', () => {
    it('实现 $patchUpdate 应该使用自定义更新逻辑', () => {
      const count = ref(0)
      const customPatch = vi.fn((oldVNode, newVNode) => newVNode)
      const TestWidget = createTestWidget({
        $patchUpdate: customPatch,
        build() {
          return createVNode('div', {}, count.value.toString())
        }
      })
      const vnode = createVNode(TestWidget, {})
      renderNode(vnode)
      mountNode(vnode, container)

      count.value++
      flushScheduler()

      expect(customPatch).toHaveBeenCalled()
    })
  })
})
