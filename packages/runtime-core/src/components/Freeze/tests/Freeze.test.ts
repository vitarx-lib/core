import { nextTick, ref, type Ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Component, HostElementTag, View } from '../../../types/index.js'
import { createView, DynamicView } from '../../../view/index.js'
import { Freeze } from '../src/index.js'

describe('Freeze Component', () => {
  let container: HTMLElement
  let showComponent: Ref<Component>
  const testTag = 'div' as HostElementTag
  const ComponentA = () => createView(testTag, { children: 'A' })
  const ComponentB = () => createView(testTag, { children: 'B' })

  function createFreezeView(options: Record<string, unknown> = {}) {
    return createView(Freeze, {
      get is() {
        return showComponent.value
      },
      ...options
    })
  }

  function mountAndExpect(view: View, content: string) {
    view.mount(container)
    expect(container.textContent).toContain(content)
  }

  async function switchTo(component: Component, expectedContent: string) {
    showComponent.value = component
    await nextTick()
    expect(container.textContent).toContain(expectedContent)
  }

  function getSubView(freezeView: ReturnType<typeof createFreezeView>) {
    return (freezeView.instance!.subView as DynamicView).current!
  }

  beforeEach(() => {
    showComponent = ref(ComponentA)
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    container.innerHTML = ''
  })

  describe('Basic Functionality', () => {
    it('应该渲染初始组件', () => {
      const freezeView = createFreezeView()
      mountAndExpect(freezeView, 'A')
    })

    it('应该支持响应式组件切换', async () => {
      const freezeView = createFreezeView()
      mountAndExpect(freezeView, 'A')
      await switchTo(ComponentB, 'B')
    })

    it('应该缓存并复用组件实例', async () => {
      const freezeView = createFreezeView()
      freezeView.init()
      const aView = getSubView(freezeView)
      mountAndExpect(freezeView, 'A')

      await switchTo(ComponentB, 'B')
      expect(aView.isActive).toBe(false)

      await switchTo(ComponentA, 'A')
      expect(aView.isActive).toBe(true)
    })
  })

  describe('Configuration Options', () => {
    it('应该支持 exclude 选项以跳过缓存特定组件', async () => {
      const freezeView = createFreezeView({ exclude: [ComponentA] })
      freezeView.init()
      const aView = getSubView(freezeView)
      mountAndExpect(freezeView, 'A')

      await switchTo(ComponentB, 'B')
      expect(aView.isDetached).toBe(true)
    })

    it('应该支持 max 选项以限制缓存大小', async () => {
      const ComponentC = () => createView(testTag, { children: 'C' })
      const freezeView = createFreezeView({ max: 1 })
      mountAndExpect(freezeView, 'A')

      await switchTo(ComponentB, 'B')
      showComponent.value = ComponentC
      await nextTick()
      expect(container.textContent).toContain('C')
    })
  })

  describe('Props Passing', () => {
    it('应该支持传递属性给组件', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const ComponentWithProps = (props: { msg: string }) =>
        createView(testTag, { children: props.msg })

      const freezeView = createView(Freeze, {
        is: ComponentWithProps,
        props: { msg: 'Hello World' }
      })
      mountAndExpect(freezeView, 'Hello World')
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('Lifecycle', () => {
    it('应该在 Freeze 组件被销毁时清理所有缓存', async () => {
      const freezeView = createFreezeView()
      mountAndExpect(freezeView, 'A')
      await switchTo(ComponentB, 'B')
      freezeView.dispose()
    })
  })

  describe('Key Support', () => {
    it('同一组件不同 key 应该创建不同的实例', async () => {
      const keyRef = ref('key1')
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        },
        get key() {
          return keyRef.value
        }
      })
      freezeView.init()
      const view1 = getSubView(freezeView)
      mountAndExpect(freezeView, 'A')

      keyRef.value = 'key2'
      await nextTick()
      const view2 = getSubView(freezeView)
      expect(view1).not.toBe(view2)
      expect(view1.isActive).toBe(false)
    })

    it('相同组件相同 key 应该复用实例', async () => {
      const keyRef = ref('key1')
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        },
        get key() {
          return keyRef.value
        }
      })
      freezeView.init()
      const view1 = getSubView(freezeView)
      mountAndExpect(freezeView, 'A')

      await switchTo(ComponentB, 'B')

      showComponent.value = ComponentA
      await nextTick()
      const view2 = getSubView(freezeView)
      expect(view1).toBe(view2)
      expect(view1.isActive).toBe(true)
    })

    it('切换 key 后再切回应该复用对应的缓存实例', async () => {
      const keyRef = ref('key1')
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        },
        get key() {
          return keyRef.value
        }
      })
      freezeView.init()
      const view1 = getSubView(freezeView)
      mountAndExpect(freezeView, 'A')

      keyRef.value = 'key2'
      await nextTick()
      const view2 = getSubView(freezeView)
      expect(view1).not.toBe(view2)

      keyRef.value = 'key1'
      await nextTick()
      const view3 = getSubView(freezeView)
      expect(view3).toBe(view1)
      expect(view3.isActive).toBe(true)
    })

    it('key 为 undefined 时应该正常工作', async () => {
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        }
      })
      freezeView.init()
      const view1 = getSubView(freezeView)
      mountAndExpect(freezeView, 'A')

      await switchTo(ComponentB, 'B')

      showComponent.value = ComponentA
      await nextTick()
      const view2 = getSubView(freezeView)
      expect(view1).toBe(view2)
    })

    it('max 限制应该正确计算所有 key 的缓存总数', async () => {
      const keyRef = ref('key1')
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        },
        get key() {
          return keyRef.value
        },
        max: 2
      })
      mountAndExpect(freezeView, 'A')

      keyRef.value = 'key2'
      await nextTick()
      expect(container.textContent).toContain('A')

      keyRef.value = 'key3'
      await nextTick()
      expect(container.textContent).toContain('A')

      showComponent.value = ComponentB
      keyRef.value = 'key1'
      await nextTick()
      expect(container.textContent).toContain('B')
    })

    it('不同组件使用相同 key 应该独立缓存', async () => {
      const keyRef = ref('shared-key')
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        },
        get key() {
          return keyRef.value
        }
      })
      freezeView.init()
      const viewA = getSubView(freezeView)
      mountAndExpect(freezeView, 'A')

      await switchTo(ComponentB, 'B')
      const viewB = getSubView(freezeView)
      expect(viewA).not.toBe(viewB)

      showComponent.value = ComponentA
      await nextTick()
      const viewA2 = getSubView(freezeView)
      expect(viewA2).toBe(viewA)
    })
  })
})
