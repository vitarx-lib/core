import { nextTick, ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CommentView,
  type Component,
  createView,
  Dynamic,
  DynamicView,
  type HostElementTag,
  IS_VIEW_BUILDER,
  isDynamicView,
  ViewKind
} from '../../../src/index.js'

describe('Dynamic Builder', () => {
  describe('构建器功能', () => {
    it('应该被标记为视图构建器', () => {
      expect(Dynamic[IS_VIEW_BUILDER]).toBe(true)
    })

    it('应该创建 DynamicView 实例当 is 是响应式时', () => {
      const isRef = ref<HostElementTag>('div')
      const view = Dynamic({
        get is() {
          return isRef.value
        }
      })

      expect(view).toBeInstanceOf(DynamicView)
      expect(view.kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const isRef = ref<HostElementTag>('div')
      const view = Dynamic(
        {
          get is() {
            return isRef.value
          }
        },
        location
      )

      expect(view.location).toBe(location)
    })
  })

  describe('静态视图', () => {
    it('当 is 是静态组件时应该返回静态视图', () => {
      const TestComponent = () => createView('div', { children: 'Test' })
      const view = Dynamic({ is: TestComponent })

      expect(view).not.toBeInstanceOf(DynamicView)
      expect(view.kind).toBe(ViewKind.COMPONENT)
    })

    it('当 is 是静态标签时应该返回静态视图', () => {
      const view = Dynamic({ is: 'div' })

      expect(view).not.toBeInstanceOf(DynamicView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
    })

    it('应该正确传递属性到静态视图', () => {
      const view = Dynamic({ is: 'div', className: 'test-class' })

      expect(view.kind).toBe(ViewKind.ELEMENT)
    })
  })

  describe('动态视图', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
    })

    it('应该能够挂载和卸载', () => {
      const isRef = ref<HostElementTag>('div')
      const view = Dynamic({
        get is() {
          return isRef.value
        }
      })

      expect(() => {
        view.mount(container)
      }).not.toThrow()

      expect(() => {
        view.dispose()
      }).not.toThrow()
    })

    it('应该追踪响应式依赖', async () => {
      const isRef = ref<HostElementTag>('div')
      const view = Dynamic({
        get is() {
          return isRef.value
        }
      })

      view.init()
      view.mount(container)

      expect(container.children.length).toBe(1)
      expect(container.children[0].tagName).toBe('DIV')

      isRef.value = 'span'
      await nextTick()
      expect(container.children.length).toBe(1)
      expect(container.children[0].tagName).toBe('SPAN')

      view.dispose()
    })

    it('应该支持动态切换组件', async () => {
      const ComponentA = () => createView('div', { children: 'Component A' })
      const ComponentB = () => createView('span', { children: 'Component B' })
      const isRef = ref<Component>(ComponentA)

      const view = Dynamic({
        get is() {
          return isRef.value
        }
      })
      view.init()
      view.mount(container)

      expect(container.innerHTML).toContain('Component A')

      isRef.value = ComponentB
      await nextTick()
      expect(container.innerHTML).toContain('Component B')

      view.dispose()
    })

    it('应该正确传递动态属性', async () => {
      const isRef = ref<HostElementTag>('div')
      const classNameRef = ref('initial-class')
      const view = Dynamic({
        get is() {
          return isRef.value
        },
        get class() {
          return classNameRef.value
        }
      })

      view.mount(container)

      const element = container.children[0] as HTMLElement
      expect(element.className).toBe('initial-class')

      classNameRef.value = 'updated-class'
      await nextTick()
      expect(element.className).toBe('updated-class')

      view.dispose()
    })
  })

  describe('错误处理', () => {
    it('当 is 为空时应该返回 CommentView', () => {
      const view = Dynamic({ is: null as any })

      expect(view).toBeInstanceOf(CommentView)
    })

    it('当 is 为 undefined 时应该返回 CommentView', () => {
      const view = Dynamic({ is: undefined as any })

      expect(view).toBeInstanceOf(CommentView)
    })

    it('当 is 为空字符串时应该返回 CommentView', () => {
      const view = Dynamic({ is: '' as any })

      expect(view).toBeInstanceOf(CommentView)
    })

    it('当 is 为false时应该返回 CommentView', () => {
      const view = Dynamic({ is: false })

      expect(view).toBeInstanceOf(CommentView)
    })
  })

  describe('边界情况', () => {
    it('应该处理多个自定义属性', () => {
      const isRef = ref<HostElementTag>('div')
      const props = {
        get is() {
          return isRef.value
        },
        className: 'test-class',
        id: 'test-id',
        'data-test': 'test-value',
        onClick: vi.fn()
      }

      const view = Dynamic(props)

      expect(isDynamicView(view)).toBeTruthy()
    })

    it('应该处理响应式的属性值', () => {
      const isRef = ref<HostElementTag>('div')
      const classNameRef = ref('dynamic-class')
      const view = Dynamic({
        get is() {
          return isRef.value
        },
        get className() {
          return classNameRef.value
        }
      })

      expect(view).toBeInstanceOf(DynamicView)
    })
  })

  describe('类型安全', () => {
    it('应该有正确的类型签名', () => {
      const isRef = ref<HostElementTag>('div')
      const view = Dynamic({
        get is() {
          return isRef.value
        }
      })

      expect(view).toBeDefined()
    })
  })

  describe('集成测试', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
    })

    it('应该支持在组件中使用 Dynamic', () => {
      const TestComponent = () => {
        const isRef = ref<HostElementTag>('div')
        return Dynamic({
          get is() {
            return isRef.value
          }
        })
      }

      const view = TestComponent()
      view.init()
      view.mount(container)

      expect(container.children.length).toBe(1)
      expect(container.children[0].tagName).toBe('DIV')

      view.dispose()
    })
  })

  describe('Key Support with Memo', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
    })

    it('同一组件不同 key 应该创建不同的实例', async () => {
      const Component = () => createView('div', { children: 'Test' })
      const isRef = ref<Component>(Component)
      const keyRef = ref('key1')

      const view = Dynamic({
        get is() {
          return isRef.value
        },
        get key() {
          return keyRef.value
        },
        memo: true
      })
      view.init()
      view.mount(container)

      const view1 = (view as DynamicView).current

      keyRef.value = 'key2'
      await nextTick()
      const view2 = (view as DynamicView).current

      expect(view1).not.toBe(view2)
      expect(view1!.isActive).toBe(false)

      view.dispose()
    })

    it('相同组件相同 key 应该复用实例', async () => {
      const Component = () => createView('div', { children: 'Test' })
      const isRef = ref<Component>(Component)
      const keyRef = ref('key1')

      const view = Dynamic({
        get is() {
          return isRef.value
        },
        get key() {
          return keyRef.value
        },
        memo: true
      })
      view.init()
      view.mount(container)

      const view1 = (view as DynamicView).current

      isRef.value = () => createView('span', { children: 'Component B' })
      await nextTick()

      isRef.value = Component
      await nextTick()
      const view2 = (view as DynamicView).current

      expect(view1).toBe(view2)
      expect(view1!.isActive).toBe(true)

      view.dispose()
    })

    it('切换 key 后再切回应该复用对应的缓存实例', async () => {
      const Component = () => createView('div', { children: 'Test' })
      const isRef = ref<Component>(Component)
      const keyRef = ref('key1')

      const view = Dynamic({
        get is() {
          return isRef.value
        },
        get key() {
          return keyRef.value
        },
        memo: true
      })
      view.init()
      view.mount(container)

      const view1 = (view as DynamicView).current

      keyRef.value = 'key2'
      await nextTick()
      const view2 = (view as DynamicView).current
      expect(view1).not.toBe(view2)

      keyRef.value = 'key1'
      await nextTick()
      const view3 = (view as DynamicView).current
      expect(view3).toBe(view1)
      expect(view3!.isActive).toBe(true)

      view.dispose()
    })

    it('key 为 undefined 时应该正常工作', async () => {
      const Component = () => createView('div', { children: 'Test' })
      const isRef = ref<Component>(Component)

      const view = Dynamic({
        get is() {
          return isRef.value
        },
        memo: true
      })
      view.init()
      view.mount(container)

      const view1 = (view as DynamicView).current

      isRef.value = () => createView('span', { children: 'Component B' })
      await nextTick()

      isRef.value = Component
      await nextTick()
      const view2 = (view as DynamicView).current

      expect(view1).toBe(view2)

      view.dispose()
    })

    it('max 限制应该正确计算所有 key 的缓存总数', async () => {
      const Component = () => createView('div', { children: 'Test' })
      const isRef = ref<Component>(Component)
      const keyRef = ref('key1')

      const view = Dynamic({
        get is() {
          return isRef.value
        },
        get key() {
          return keyRef.value
        },
        memo: 2
      })
      view.init()
      view.mount(container)

      const view1 = (view as DynamicView).current

      keyRef.value = 'key2'
      await nextTick()

      keyRef.value = 'key3'
      await nextTick()

      keyRef.value = 'key1'
      await nextTick()
      const viewAfter = (view as DynamicView).current

      expect(viewAfter).not.toBe(view1)

      view.dispose()
    })

    it('不同组件使用相同 key 应该独立缓存', async () => {
      const ComponentA = () => createView('div', { children: 'A' })
      const ComponentB = () => createView('span', { children: 'B' })
      const isRef = ref<Component>(ComponentA)
      const keyRef = ref('shared-key')

      const view = Dynamic({
        get is() {
          return isRef.value
        },
        get key() {
          return keyRef.value
        },
        memo: true
      })
      view.init()
      view.mount(container)

      const viewA = (view as DynamicView).current

      isRef.value = ComponentB
      await nextTick()
      const viewB = (view as DynamicView).current
      expect(viewA).not.toBe(viewB)

      isRef.value = ComponentA
      await nextTick()
      const viewA2 = (view as DynamicView).current
      expect(viewA2).toBe(viewA)

      view.dispose()
    })

    it('不启用 memo 时 key 应该无效', async () => {
      const Component = () => createView('div', { children: 'Test' })
      const isRef = ref<Component>(Component)
      const keyRef = ref('key1')

      const view = Dynamic({
        get is() {
          return isRef.value
        },
        get key() {
          return keyRef.value
        }
      })
      view.init()
      view.mount(container)

      const view1 = (view as DynamicView).current

      keyRef.value = 'key2'
      await nextTick()
      const view2 = (view as DynamicView).current

      expect(view1).not.toBe(view2)

      view.dispose()
    })
  })
})
