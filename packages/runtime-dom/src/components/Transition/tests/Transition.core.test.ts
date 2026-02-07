import { nextTick, ref } from '@vitarx/responsive'
import { build, createView, type HostElementTag } from '@vitarx/runtime-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Transition } from '../src/index.js'

describe('Transition 组件', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    container.innerHTML = ''
  })

  describe('默认属性', () => {
    it('应该有正确的默认属性', () => {
      expect(Transition.defaultProps).toEqual({
        name: 'v',
        appear: false,
        css: true,
        type: 'default',
        mode: 'default'
      })
    })
  })

  describe('基础功能', () => {
    it('应该渲染子节点', () => {
      const ComponentA = () =>
        createView('div', {
          id: 'test-child',
          children: 'Test Content'
        })

      const transitionView = createView(Transition, {
        children: createView(ComponentA)
      })

      transitionView.mount(container)

      expect(container.querySelector('#test-child')).toBeTruthy()
      expect(container.textContent).toContain('Test Content')

      transitionView.dispose()
    })

    it('应该支持嵌套元素', () => {
      const ComponentA = () =>
        createView('div', {
          id: 'nested-child',
          children: createView('span' as HostElementTag, { children: 'Nested Content' })
        })

      const transitionView = createView(Transition, {
        children: createView(ComponentA)
      })

      transitionView.mount(container)

      expect(container.querySelector('#nested-child')).toBeTruthy()
      expect(container.textContent).toContain('Nested Content')

      transitionView.dispose()
    })
  })

  describe('CSS 过渡', () => {
    it('应该在 enter 时应用 CSS 类名', () => {
      const ComponentA = () =>
        createView('div', {
          id: 'css-child',
          children: 'CSS Content'
        })

      const transitionView = createView(Transition, {
        name: 'fade',
        children: createView(ComponentA)
      })

      transitionView.mount(container)

      const child = container.querySelector('#css-child') as HTMLElement
      expect(child).toBeTruthy()

      transitionView.dispose()
    })

    it('应该使用自定义 CSS 类名', () => {
      const ComponentA = () =>
        createView('div', {
          id: 'custom-class-child',
          children: 'Custom Class Content'
        })

      const transitionView = createView(Transition, {
        name: 'custom',
        enterFromClass: 'custom-enter-from',
        enterActiveClass: 'custom-enter-active',
        enterToClass: 'custom-enter-to',
        children: createView(ComponentA)
      })

      transitionView.mount(container)

      const child = container.querySelector('#custom-class-child') as HTMLElement
      expect(child).toBeTruthy()

      transitionView.dispose()
    })

    it('应该支持不同的过渡类型', () => {
      const ComponentA = () =>
        createView('div', {
          id: 'type-child',
          children: 'Type Content'
        })

      const transitionView = createView(Transition, {
        name: 'slide',
        type: 'transition',
        children: createView(ComponentA)
      })

      transitionView.mount(container)

      expect(container.querySelector('#type-child')).toBeTruthy()

      transitionView.dispose()
    })
  })

  describe('JavaScript 钩子', () => {
    it('应该调用 onBeforeEnter 钩子', async () => {
      const onBeforeEnter = vi.fn()
      const show = ref(false)

      const ComponentA = () =>
        createView('div', {
          id: 'hook-child',
          children: 'Hook Content'
        })

      const transitionView = createView(Transition, {
        onBeforeEnter,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = true
      await nextTick()

      expect(onBeforeEnter).toHaveBeenCalled()

      transitionView.dispose()
    })

    it('应该调用 onAfterEnter 钩子', async () => {
      const onAfterEnter = vi.fn()
      const show = ref(false)

      const ComponentA = () =>
        createView('div', {
          id: 'after-enter-child',
          children: 'After Enter Content'
        })

      const transitionView = createView(Transition, {
        onAfterEnter,
        duration: 0,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = true
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(onAfterEnter).toHaveBeenCalled()

      transitionView.dispose()
    })

    it('应该调用 onBeforeLeave 钩子', async () => {
      const onBeforeLeave = vi.fn()
      const show = ref(true)

      const ComponentA = () =>
        createView('div', {
          id: 'before-leave-child',
          children: 'Before Leave Content'
        })

      const transitionView = createView(Transition, {
        onBeforeLeave,
        duration: 0,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = false
      await nextTick()

      expect(onBeforeLeave).toHaveBeenCalled()

      transitionView.dispose()
    })

    it('应该调用 onAfterLeave 钩子', async () => {
      const onAfterLeave = vi.fn()
      const show = ref(true)

      const ComponentA = () =>
        createView('div', {
          id: 'after-leave-child',
          children: 'After Leave Content'
        })

      const transitionView = createView(Transition, {
        onAfterLeave,
        duration: 0,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = false
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(onAfterLeave).toHaveBeenCalled()

      transitionView.dispose()
    })

    it('应该支持自定义 enter 钩子', async () => {
      const onEnter = vi.fn((el, done) => {
        done()
      })
      const show = ref(false)

      const ComponentA = () =>
        createView('div', {
          id: 'custom-enter-child',
          children: 'Custom Enter Content'
        })

      const transitionView = createView(Transition, {
        css: false,
        onEnter,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = true
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(onEnter).toHaveBeenCalled()

      transitionView.dispose()
    })

    it('应该支持自定义 leave 钩子', async () => {
      const onLeave = vi.fn((el, done) => {
        done()
      })
      const show = ref(true)

      const ComponentA = () =>
        createView('div', {
          id: 'custom-leave-child',
          children: 'Custom Leave Content'
        })

      const transitionView = createView(Transition, {
        css: false,
        onLeave,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = false
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(onLeave).toHaveBeenCalled()

      transitionView.dispose()
    })
  })

  describe('appear 功能', () => {
    it('应该在 appear 为 true 时触发初始过渡', async () => {
      const onAppear = vi.fn((_el, done) => {
        done()
      })
      const onAfterAppear = vi.fn()

      const ComponentA = () =>
        createView('div', {
          id: 'appear-child',
          children: 'Appear Content'
        })

      const transitionView = createView(Transition, {
        appear: true,
        css: false,
        onAppear,
        onAfterAppear,
        children: createView(ComponentA)
      })

      transitionView.mount(container)
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(onAppear).toHaveBeenCalled()
      expect(onAfterAppear).toHaveBeenCalled()
      transitionView.dispose()
    })

    it('应该在 appear 为 false 时不触发初始过渡', async () => {
      const onAppear = vi.fn()

      const ComponentA = () =>
        createView('div', {
          id: 'no-appear-child',
          children: 'No Appear Content'
        })

      const show = ref(false)

      const transitionView = createView(Transition, {
        appear: false,
        css: false,
        onAppear,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = true
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(onAppear).not.toHaveBeenCalled()

      transitionView.dispose()
    })
  })

  describe('过渡模式', () => {
    it('应该支持 default 模式', async () => {
      const show = ref(true)

      const ComponentA = () =>
        createView('div', {
          id: 'default-mode-child',
          children: 'Default Mode Content'
        })

      const transitionView = createView(Transition, {
        mode: 'default',
        duration: 0,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)

      await nextTick()
      expect(container.querySelector('#default-mode-child')).toBeTruthy()

      show.value = false
      await nextTick()

      transitionView.dispose()
    })

    it('应该支持 out-in 模式', async () => {
      const show = ref(true)

      const ComponentA = () =>
        createView('div', {
          id: 'out-in-child',
          children: 'Out-In Content'
        })

      const transitionView = createView(Transition, {
        mode: 'out-in',
        duration: 0,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)

      await nextTick()
      expect(container.querySelector('#out-in-child')).toBeTruthy()

      show.value = false
      await nextTick()

      transitionView.dispose()
    })

    it('应该支持 in-out 模式', async () => {
      const show = ref(true)

      const ComponentA = () =>
        createView('div', {
          id: 'in-out-child',
          children: 'In-Out Content'
        })

      const transitionView = createView(Transition, {
        mode: 'in-out',
        duration: 0,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)

      await nextTick()
      expect(container.querySelector('#in-out-child')).toBeTruthy()

      show.value = false
      await nextTick()

      transitionView.dispose()
    })
  })

  describe('持续时间', () => {
    it('应该支持数字类型的持续时间', async () => {
      const onAfterEnter = vi.fn()
      const show = ref(false)

      const ComponentA = () =>
        createView('div', {
          id: 'duration-child',
          children: 'Duration Content'
        })

      const transitionView = createView(Transition, {
        duration: 100,
        onAfterEnter,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = true
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(onAfterEnter).toHaveBeenCalled()

      transitionView.dispose()
    })

    it('应该支持对象类型的持续时间', async () => {
      const onAfterEnter = vi.fn()
      const show = ref(false)

      const ComponentA = () =>
        createView('div', {
          id: 'object-duration-child',
          children: 'Object Duration Content'
        })

      const transitionView = createView(Transition, {
        duration: { enter: 50, leave: 100 },
        onAfterEnter,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = true
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(onAfterEnter).toHaveBeenCalled()

      transitionView.dispose()
    })
  })

  describe('生命周期', () => {
    it('应该在销毁时正确清理资源', () => {
      const ComponentA = () =>
        createView('div', {
          id: 'lifecycle-child',
          children: 'Lifecycle Content'
        })

      const transitionView = createView(Transition, {
        children: createView(ComponentA)
      })

      transitionView.mount(container)

      expect(container.querySelector('#lifecycle-child')).toBeTruthy()

      transitionView.dispose()

      expect(container.innerHTML).toBe('')
    })

    it('应该在多次挂载和销毁时正常工作', () => {
      const ComponentA = () =>
        createView('div', {
          id: 'multi-lifecycle-child',
          children: 'Multi Lifecycle Content'
        })

      const transitionView = createView(Transition, {
        children: createView(ComponentA)
      })

      transitionView.mount(container)
      expect(container.querySelector('#multi-lifecycle-child')).toBeTruthy()

      transitionView.dispose()
      expect(container.innerHTML).toBe('')

      transitionView.mount(container)
      expect(container.querySelector('#multi-lifecycle-child')).toBeTruthy()

      transitionView.dispose()
      expect(container.innerHTML).toBe('')
    })
  })

  describe('边界情况', () => {
    it('应该处理非元素节点', () => {
      const ComponentA = () =>
        createView('div', {
          id: 'text-child',
          children: 'Text Content'
        })

      const transitionView = createView(Transition, {
        children: createView(ComponentA)
      })

      transitionView.mount(container)

      expect(container.textContent).toContain('Text Content')

      transitionView.dispose()
    })

    it('应该处理空子节点', () => {
      const ComponentA = () =>
        createView('div', {
          id: 'empty-child',
          children: ''
        })

      const transitionView = createView(Transition, {
        children: createView(ComponentA)
      })

      transitionView.mount(container)

      expect(container.querySelector('#empty-child')).toBeTruthy()

      transitionView.dispose()
    })

    it('应该处理极短的持续时间', async () => {
      const onAfterEnter = vi.fn()
      const show = ref(false)

      const ComponentA = () =>
        createView('div', {
          id: 'short-duration-child',
          children: 'Short Duration Content'
        })

      const transitionView = createView(Transition, {
        duration: 1,
        onAfterEnter,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = true
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(onAfterEnter).toHaveBeenCalled()

      transitionView.dispose()
    })

    it('应该处理零持续时间', async () => {
      const onAfterEnter = vi.fn()
      const show = ref(false)

      const ComponentA = () =>
        createView('div', {
          id: 'zero-duration-child',
          children: 'Zero Duration Content'
        })

      const transitionView = createView(Transition, {
        duration: 0,
        onAfterEnter,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = true
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(onAfterEnter).toHaveBeenCalled()

      transitionView.dispose()
    })
  })

  describe('取消钩子', () => {
    it('应该支持 onEnterCancelled 钩子', async () => {
      const onEnterCancelled = vi.fn()
      const show = ref(false)

      const ComponentA = () =>
        createView('div', {
          id: 'cancel-enter-child',
          children: 'Cancel Enter Content'
        })

      const transitionView = createView(Transition, {
        onEnterCancelled,
        duration: 1000,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = true
      await nextTick()

      show.value = false
      await nextTick()

      expect(onEnterCancelled).toHaveBeenCalled()

      transitionView.dispose()
    })

    it('应该支持 onLeaveCancelled 钩子', async () => {
      const onLeaveCancelled = vi.fn()
      const show = ref(true)

      const ComponentA = () =>
        createView('div', {
          id: 'cancel-leave-child',
          children: 'Cancel Leave Content'
        })
      const v = createView(ComponentA)
      const transitionView = createView(Transition, {
        onLeaveCancelled,
        duration: 1000,
        children: build(() => (show.value ? v : null))
      })

      transitionView.mount(container)
      await nextTick()

      show.value = false
      await nextTick()
      show.value = true
      await nextTick()
      expect(onLeaveCancelled).toHaveBeenCalled()
      transitionView.dispose()
    })

    it('应该支持 onAppearCancelled 钩子', async () => {
      const onAppearCancelled = vi.fn()
      const show = ref(true)

      const ComponentA = () =>
        createView('div', {
          id: 'cancel-appear-child',
          children: 'Cancel Appear Content'
        })

      const transitionView = createView(Transition, {
        appear: true,
        onAppearCancelled,
        duration: 1000,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)
      await nextTick()
      show.value = false
      await nextTick()
      expect(onAppearCancelled).toHaveBeenCalled()
      transitionView.dispose()
    })
  })

  describe('CSS 类名自定义', () => {
    it('应该支持自定义 leave 类名', async () => {
      const show = ref(true)

      const ComponentA = () =>
        createView('div', {
          id: 'custom-leave-child',
          children: 'Custom Leave Content'
        })

      const transitionView = createView(Transition, {
        name: 'slide',
        leaveFromClass: 'slide-leave-from',
        leaveActiveClass: 'slide-leave-active',
        leaveToClass: 'slide-leave-to',
        duration: 0,
        children: build(() => (show.value ? createView(ComponentA) : null))
      })

      transitionView.mount(container)

      await nextTick()

      const child = container.querySelector('#custom-leave-child') as HTMLElement
      expect(child).toBeTruthy()

      show.value = false
      await nextTick()

      transitionView.dispose()
    })

    it('应该支持自定义 appear 类名', async () => {
      const onAfterAppear = vi.fn()

      const ComponentA = () =>
        createView('div', {
          id: 'custom-appear-child',
          children: 'Custom Appear Content'
        })

      const transitionView = createView(Transition, {
        appear: true,
        name: 'fade',
        appearFromClass: 'fade-appear-from',
        appearActiveClass: 'fade-appear-active',
        appearToClass: 'fade-appear-to',
        onAfterAppear,
        duration: 0,
        children: createView(ComponentA)
      })
      transitionView.mount(container)
      const element = transitionView.node as HTMLElement
      console.log(element.className)
      expect(element.className).toBe('fade-appear-from fade-appear-active')
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(element.className).toBe('')
      expect(onAfterAppear).toHaveBeenCalled()

      transitionView.dispose()
    })
  })
})
