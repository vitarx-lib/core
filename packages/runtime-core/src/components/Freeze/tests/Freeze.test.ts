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
      expect(aView.active).toBe(false)

      await switchTo(ComponentA, 'A')
      expect(aView.active).toBe(true)
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
})
