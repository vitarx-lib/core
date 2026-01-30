import { nextTick, ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { build, ComponentView, createView, SwitchView } from '../../../core/index.js'
import type { HostElementTag } from '../../../types/index.js'
import { Freeze } from '../src/index.js'

describe('Freeze Component', () => {
  let container: HTMLElement
  const testTag = 'div' as HostElementTag
  const ComponentA = () => 'A'
  const ComponentB = () => 'B'
  const showComponent = ref(ComponentA)
  const childView = build(() => createView(showComponent.value)) as SwitchView<ComponentView>
  beforeEach(() => {
    showComponent.value = ComponentA
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    childView.dispose()
    document.body.removeChild(container)
    container.innerHTML = ''
  })

  describe('Props Validation', () => {
    it('应该验证 children 属性是视图对象', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        Freeze.validateProps({ children: 'not a view' })
      }).toThrowError()

      expect(() => {
        const view = createView(testTag, { children: 'Valid view' })
        // @ts-expect-error - Testing invalid input
        Freeze.validateProps({ children: view })
      }).not.toThrowError()
    })
  })

  describe('Basic Functionality', () => {
    it('应该直接返回子视图', () => {
      const result = Freeze({ children: childView })
      expect(result).toBe(childView)
    })

    it('应该在 Freeze 内部渲染子视图', () => {
      const freezeView = createView(Freeze, { children: childView })
      freezeView.mount(container)
      expect(container.textContent).toContain('A')
    })
  })

  describe('Configuration Options', () => {
    it('应该支持 include 选项以缓存特定组件', async () => {
      const freezeView = createView(Freeze, {
        children: childView,
        include: [ComponentA]
      })
      freezeView.init()
      const aView = childView.current!
      freezeView.mount(container)
      expect(container.textContent).toContain('A')
      showComponent.value = ComponentB
      await nextTick()
      const bView = childView.current!
      expect(container.textContent).toContain('B')
      expect(aView.isDeactivated).toBe(true)
      showComponent.value = ComponentA
      await nextTick()
      expect(container.textContent).toContain('A')
      expect(bView.isUnused).toBe(true)
    })

    it('应该支持 exclude 选项以跳过缓存特定组件', async () => {
      const freezeView = createView(Freeze, {
        children: childView,
        exclude: [ComponentA]
      })
      freezeView.init()
      const aView = childView.current!
      freezeView.mount(container)
      expect(container.textContent).toContain('A')
      showComponent.value = ComponentB
      await nextTick()
      expect(aView.isUnused).toBe(true)
      expect(container.textContent).toContain('B')
    })

    it('应该支持 max 选项以限制缓存大小', () => {
      const ComponentA = (props: { msg: string }) =>
        createView(testTag, { children: `A: ${props.msg}` })

      const childView = createView(ComponentA, { msg: 'test' })

      const freezeView = createView(Freeze, {
        children: childView,
        max: 3
      })

      freezeView.mount(container)

      expect(container.textContent).toContain('A: test')
    })
  })

  describe('Lifecycle', () => {
    it('应该在 Freeze 组件被销毁时处置子视图', () => {
      const freezeView = createView(Freeze, { children: childView })

      freezeView.mount(container)
      expect(container.textContent).toContain('A')

      // 记录视图销毁的方法
      const disposeSpy = vi.spyOn(childView, 'dispose')

      freezeView.dispose()
      expect(disposeSpy).toHaveBeenCalled()
    })
  })

  describe('Integration', () => {
    it('应该与基本视图一起工作', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => void 0)
      const childView = createView(testTag, { children: 'Integrated content' })
      const freezeView = createView(Freeze, { children: childView })
      freezeView.mount(container)
      expect(spy).toHaveBeenCalled()
      expect(container.textContent).toContain('Integrated content')
    })
  })
})
