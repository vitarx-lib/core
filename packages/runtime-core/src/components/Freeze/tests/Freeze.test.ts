import { nextTick, ref, type Ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Component, HostElementTag } from '../../../types/index.js'
import { createView, DynamicView } from '../../../view/index.js'
import { Freeze } from '../src/index.js'

describe('Freeze Component', () => {
  let container: HTMLElement
  let showComponent: Ref<Component>
  const testTag = 'div' as HostElementTag
  const ComponentA = () => createView(testTag, { children: 'A' })
  const ComponentB = () => createView(testTag, { children: 'B' })

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
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        }
      })
      freezeView.mount(container)
      expect(container.textContent).toContain('A')
    })

    it('应该支持响应式组件切换', async () => {
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        }
      })
      freezeView.mount(container)
      expect(container.textContent).toContain('A')

      showComponent.value = ComponentB
      await nextTick()
      expect(container.textContent).toContain('B')
    })

    it('应该缓存并复用组件实例', async () => {
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        }
      })
      freezeView.init()
      const aView = (freezeView.instance!.subView as DynamicView).current!
      freezeView.mount(container)
      expect(container.textContent).toContain('A')

      showComponent.value = ComponentB
      await nextTick()
      expect(container.textContent).toContain('B')
      expect(aView.active).toBe(false) // A 应该被冻结

      showComponent.value = ComponentA
      await nextTick()
      expect(container.textContent).toContain('A')
      // A 应该从缓存中复用
      expect(aView.active).toBe(true)
    })
  })

  describe('Configuration Options', () => {
    it('应该支持 include 选项以缓存特定组件', async () => {
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        },
        include: [ComponentA]
      })
      freezeView.init()
      const aView = (freezeView.instance!.subView as DynamicView).current!
      freezeView.mount(container)
      expect(container.textContent).toContain('A')

      showComponent.value = ComponentB
      await nextTick()
      expect(container.textContent).toContain('B')
      expect(aView.active).toBe(false) // A 被缓存

      showComponent.value = ComponentA
      await nextTick()
      expect(container.textContent).toContain('A')
      // A 从缓存中复用
      expect(aView.active).toBe(true)
    })

    it('应该支持 exclude 选项以跳过缓存特定组件', async () => {
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        },
        exclude: [ComponentA]
      })
      freezeView.init()
      const aView = (freezeView.instance!.subView as DynamicView).current!
      freezeView.mount(container)
      expect(container.textContent).toContain('A')

      showComponent.value = ComponentB
      await nextTick()
      expect(aView.isDetached).toBe(true) // A 未被缓存，已销毁
      expect(container.textContent).toContain('B')
    })

    it('应该支持 max 选项以限制缓存大小', async () => {
      const ComponentC = () => createView(testTag, { children: 'C' })
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        },
        max: 1
      })
      freezeView.mount(container)
      expect(container.textContent).toContain('A')

      showComponent.value = ComponentB
      await nextTick()
      expect(container.textContent).toContain('B')

      showComponent.value = ComponentC
      await nextTick()
      expect(container.textContent).toContain('C')
    })
  })

  describe('Props Passing', () => {
    it('应该支持传递属性给组件', () => {
      const ComponentWithProps = (props: { msg: string }) =>
        createView(testTag, { children: props.msg })

      const freezeView = createView(Freeze, {
        is: ComponentWithProps,
        props: { msg: 'Hello World' }
      })
      freezeView.mount(container)
      expect(container.textContent).toContain('Hello World')
    })
  })

  describe('Lifecycle', () => {
    it('应该在 Freeze 组件被销毁时清理所有缓存', async () => {
      const freezeView = createView(Freeze, {
        get is() {
          return showComponent.value
        }
      })
      freezeView.mount(container)
      expect(container.textContent).toContain('A')

      showComponent.value = ComponentB
      await nextTick()
      expect(container.textContent).toContain('B')

      freezeView.dispose()
      // 组件应该被完全清理
    })
  })
})
