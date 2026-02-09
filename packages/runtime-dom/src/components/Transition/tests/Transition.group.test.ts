import { nextTick, ref } from '@vitarx/responsive'
import { createView, ElementView, ListView, type View, ViewKind } from '@vitarx/runtime-core'
import { sleep } from '@vitarx/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TransitionGroup } from '../src/index.js'

describe('TransitionGroup 组件', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    container.innerHTML = ''
  })

  describe('基础功能', () => {
    it('应该渲染子节点', () => {
      const items = ref([1, 2, 3])

      const transitionGroupView = createView(TransitionGroup<number>, {
        each: items.value,
        children: (item: number) =>
          createView('div', {
            id: `item-${item}`,
            children: `Item ${item}`
          })
      })

      transitionGroupView.mount(container)

      expect(container.querySelector('#item-1')).toBeTruthy()
      expect(container.querySelector('#item-2')).toBeTruthy()
      expect(container.querySelector('#item-3')).toBeTruthy()
      expect(container.textContent).toContain('Item 1')
      expect(container.textContent).toContain('Item 2')
      expect(container.textContent).toContain('Item 3')

      transitionGroupView.dispose()
    })

    it('应该支持嵌套元素', () => {
      const items = ref([1, 2])

      const transitionGroupView = createView(TransitionGroup<number>, {
        each: items.value,
        children: (item: number) =>
          createView('div', {
            id: `nested-item-${item}`,
            children: createView('span', {
              children: `Nested Item ${item}`
            })
          })
      })

      transitionGroupView.mount(container)

      expect(container.querySelector('#nested-item-1')).toBeTruthy()
      expect(container.querySelector('#nested-item-2')).toBeTruthy()
      expect(container.textContent).toContain('Nested Item 1')
      expect(container.textContent).toContain('Nested Item 2')

      transitionGroupView.dispose()
    })

    it('应该支持使用 tag 属性指定容器标签', () => {
      const items = ref([1, 2, 3])

      const transitionGroupView = createView(TransitionGroup<number>, {
        tag: 'ul',
        each: items.value,
        children: (item: number) =>
          createView('li', {
            id: `list-item-${item}`,
            children: `List Item ${item}`
          })
      })

      transitionGroupView.mount(container)

      const ul = container.querySelector('ul')
      expect(ul).toBeTruthy()
      expect(ul?.querySelector('#list-item-1')).toBeTruthy()
      expect(ul?.querySelector('#list-item-2')).toBeTruthy()
      expect(ul?.querySelector('#list-item-3')).toBeTruthy()

      transitionGroupView.dispose()
    })

    it('应该支持不指定 tag 时直接渲染子节点', () => {
      const items = ref([1, 2])

      const transitionGroupView = createView(TransitionGroup<number>, {
        each: items.value,
        children: (item: number) =>
          createView('div', {
            id: `no-tag-item-${item}`,
            children: `No Tag Item ${item}`
          })
      })

      transitionGroupView.mount(container)

      expect(container.querySelector('#no-tag-item-1')).toBeTruthy()
      expect(container.querySelector('#no-tag-item-2')).toBeTruthy()

      transitionGroupView.dispose()
    })
  })

  describe('列表操作', () => {
    it('应该支持添加元素', async () => {
      const items = ref([1, 2])
      const onBeforeEnter = vi.fn()
      const onAfterEnter = vi.fn()

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        onBeforeEnter,
        onAfterEnter,
        duration: 0,
        children: (item: number) =>
          createView('div', {
            id: `add-item-${item}`,
            children: `Add Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      expect(container.querySelector('#add-item-1')).toBeTruthy()
      expect(container.querySelector('#add-item-2')).toBeTruthy()
      expect(container.querySelector('#add-item-3')).toBeFalsy()
      items.value = [1, 2, 3]
      await sleep(50)

      expect(container.querySelector('#add-item-3')).toBeTruthy()
      expect(onBeforeEnter).toHaveBeenCalled()
      expect(onAfterEnter).toHaveBeenCalled()

      transitionGroupView.dispose()
    })

    it('应该支持删除元素', async () => {
      const items = ref([1, 2, 3])
      const onBeforeLeave = vi.fn()
      const onAfterLeave = vi.fn()

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        onBeforeLeave,
        onAfterLeave,
        duration: 0,
        children: (item: number) =>
          createView('div', {
            id: `remove-item-${item}`,
            children: `Remove Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      expect(container.querySelector('#remove-item-2')).toBeTruthy()

      items.value = [1, 3]
      await sleep(50)

      expect(container.querySelector('#remove-item-2')).toBeFalsy()
      expect(onBeforeLeave).toHaveBeenCalled()
      expect(onAfterLeave).toHaveBeenCalled()

      transitionGroupView.dispose()
    })

    it('应该支持更新元素顺序', async () => {
      const items = ref([1, 2, 3])

      const transitionGroupView = createView(TransitionGroup<number>, {
        each: items.value,
        children: (item: number) =>
          createView('div', {
            id: `reorder-item-${item}`,
            children: `Reorder Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      const firstChild = container.children[0]
      const lastChild = container.children[2]

      items.value = [3, 2, 1]
      await nextTick()
      await sleep(50)

      expect(container.querySelector('#reorder-item-3')).toBeTruthy()
      expect(container.querySelector('#reorder-item-1')).toBeTruthy()

      transitionGroupView.dispose()
    })
  })

  describe('移动动画', () => {
    it('应该在元素移动时应用移动动画', async () => {
      const items = ref([1, 2, 3])
      const spyOn = vi.spyOn(window, 'getComputedStyle').mockImplementation(
        () =>
          ({
            transitionDuration: '10ms',
            transitionDelay: '0s',
            animationDuration: '10ms',
            animationDelay: '0s'
          }) as any
      )
      const transitionGroupView = createView(TransitionGroup<number>, {
        tag: 'div',
        get each() {
          return items.value
        },
        name: 'list',
        moveClass: 'list-move',
        type: 'transition',
        children: (item: number) =>
          createView('div', {
            id: `move-item-${item}`,
            'data-id': item,
            style: 'position: relative; transition: transform 0.3s;',
            children: `Move Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      const top1 = {
        1: 0,
        2: 50,
        3: 100
      } as const
      const top2 = {
        1: 50,
        2: 0,
        3: 100
      } as const
      const listView = (transitionGroupView.subView as ElementView).children[0] as ListView
      expect(listView.kind).toBe(ViewKind.LIST)
      const children = Array.from(listView.children)
      // 为每个元素模拟位置信息
      for (let i = 0; i < children.length; i++) {
        const element = children[i].node as HTMLDivElement & { $rect?: boolean }
        const id = Number(element.dataset.id)
        element.getBoundingClientRect = () => {
          const top = element.$rect ? top1[id as keyof typeof top1] : top2[id as keyof typeof top2]
          element.$rect = true
          return {
            width: 100,
            height: 50,
            top: top,
            left: 0,
            right: 100,
            bottom: top + 50,
            x: 0,
            y: top,
            toJSON: () => ({})
          } as DOMRect
        }
      }
      await nextTick()

      const item1 = container.querySelector('#move-item-1') as HTMLElement
      const item2 = container.querySelector('#move-item-2') as HTMLElement
      items.value = [2, 1, 3]
      await nextTick()
      // 应用
      expect(item1.classList.contains('list-move')).toBe(true)
      expect(item2.classList.contains('list-move')).toBe(true)
      await sleep(30)
      // 清除
      expect(item1.classList.contains('list-move')).toBe(false)
      expect(item2.classList.contains('list-move')).toBe(false)
      transitionGroupView.dispose()
      spyOn.mockRestore()
    })
  })

  describe('CSS 过渡', () => {
    it('应该在 enter 时应用 CSS 类名', async () => {
      const items = ref([1])

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        name: 'fade',
        children: (item: number) =>
          createView('div', {
            id: `css-enter-item-${item}`,
            children: `CSS Enter Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      const child = container.querySelector('#css-enter-item-1') as HTMLElement
      expect(child).toBeTruthy()
      items.value = [1, 2]
      await nextTick()
      const newChild = container.querySelector('#css-enter-item-2') as HTMLElement
      expect(newChild).toBeTruthy()

      transitionGroupView.dispose()
    })

    it('应该支持自定义 CSS 类名', async () => {
      const items = ref([1])

      const transitionGroupView = createView(TransitionGroup<number>, {
        each: items.value,
        name: 'custom',
        enterFromClass: 'custom-enter-from',
        enterActiveClass: 'custom-enter-active',
        enterToClass: 'custom-enter-to',
        children: (item: number) =>
          createView('div', {
            id: `custom-css-item-${item}`,
            children: `Custom CSS Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      const child = container.querySelector('#custom-css-item-1') as HTMLElement
      expect(child).toBeTruthy()

      transitionGroupView.dispose()
    })
  })

  describe('JavaScript 钩子', () => {
    it('应该调用 onBeforeEnter 钩子', async () => {
      const items = ref([1])
      const onBeforeEnter = vi.fn()

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        onBeforeEnter,
        children: (item: number) =>
          createView('div', {
            id: `before-enter-item-${item}`,
            children: `Before Enter Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      items.value = [1, 2]
      await nextTick()
      expect(onBeforeEnter).toHaveBeenCalled()

      transitionGroupView.dispose()
    })

    it('应该调用 onAfterEnter 钩子', async () => {
      const items = ref([1])
      const onAfterEnter = vi.fn()

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        onAfterEnter,
        duration: 0,
        children: (item: number) =>
          createView('div', {
            id: `after-enter-item-${item}`,
            children: `After Enter Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      items.value = [1, 2]
      await nextTick()
      await sleep(50)

      expect(onAfterEnter).toHaveBeenCalled()

      transitionGroupView.dispose()
    })

    it('应该调用 onBeforeLeave 钩子', async () => {
      const items = ref([1, 2])
      const onBeforeLeave = vi.fn()

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        onBeforeLeave,
        duration: 0,
        children: (item: number) =>
          createView('div', {
            id: `before-leave-item-${item}`,
            children: `Before Leave Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      items.value = [1]
      await nextTick()

      expect(onBeforeLeave).toHaveBeenCalled()

      transitionGroupView.dispose()
    })

    it('应该调用 onAfterLeave 钩子', async () => {
      const items = ref([1, 2])
      const onAfterLeave = vi.fn()

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        onAfterLeave,
        duration: 0,
        children: (item: number) =>
          createView('div', {
            id: `after-leave-item-${item}`,
            children: `After Leave Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      items.value = [1]
      await nextTick()
      await sleep(50)

      expect(onAfterLeave).toHaveBeenCalled()

      transitionGroupView.dispose()
    })

    it('应该支持自定义 enter 钩子', async () => {
      const items = ref([1])
      const onEnter = vi.fn((_el, done) => {
        done()
      })

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        css: false,
        onEnter,
        children: (item: number) =>
          createView('div', {
            id: `custom-enter-item-${item}`,
            children: `Custom Enter Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      items.value = [1, 2]
      await nextTick()
      await sleep(50)

      expect(onEnter).toHaveBeenCalled()

      transitionGroupView.dispose()
    })

    it('应该支持自定义 leave 钩子', async () => {
      const items = ref([1, 2])
      const onLeave = vi.fn((_el, done) => {
        done()
      })

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        css: false,
        onLeave,
        children: (item: number) =>
          createView('div', {
            id: `custom-leave-item-${item}`,
            children: `Custom Leave Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      items.value = [1]
      await nextTick()
      await sleep(50)

      expect(onLeave).toHaveBeenCalled()

      transitionGroupView.dispose()
    })
  })

  describe('自定义容器', () => {
    it('应该支持通过 bindProps 传递属性给容器', () => {
      const items = ref([1, 2])

      const transitionGroupView = createView(TransitionGroup<number>, {
        tag: 'div',
        each: items.value,
        bindProps: {
          id: 'container',
          className: 'custom-container'
        },
        children: (item: number) =>
          createView('div', {
            id: `bind-props-item-${item}`,
            children: `Bind Props Item ${item}`
          })
      })

      transitionGroupView.mount(container)

      const containerEl = container.querySelector('#container') as HTMLElement
      expect(containerEl).toBeTruthy()
      expect(containerEl.classList.contains('custom-container')).toBe(true)

      transitionGroupView.dispose()
    })

    it('应该支持不同的容器标签类型', () => {
      const items = ref([1, 2])

      const transitionGroupView = createView(TransitionGroup<number>, {
        tag: 'ul',
        each: items.value,
        bindProps: {
          className: 'list-container'
        },
        children: (item: number) =>
          createView('li', {
            id: `li-item-${item}`,
            children: `LI Item ${item}`
          })
      })

      transitionGroupView.mount(container)

      const ul = container.querySelector('ul.list-container')
      expect(ul).toBeTruthy()
      expect(ul?.querySelector('#li-item-1')).toBeTruthy()
      expect(ul?.querySelector('#li-item-2')).toBeTruthy()

      transitionGroupView.dispose()
    })
  })

  describe('边界情况', () => {
    it('应该处理空列表', () => {
      const items = ref<number[]>([])

      const transitionGroupView = createView(TransitionGroup<number>, {
        each: items.value,
        children: (item: number) =>
          createView('div', {
            id: `empty-item-${item}`,
            children: `Empty Item ${item}`
          })
      })

      transitionGroupView.mount(container)

      expect(container.children.length).toBe(0)

      transitionGroupView.dispose()
    })

    it('应该处理非元素节点', () => {
      const items = ref([1, 2])

      const transitionGroupView = createView(TransitionGroup<number>, {
        each: items.value,
        children: (item: number) => `Text Item ${item}`
      })

      transitionGroupView.mount(container)

      expect(container.textContent).toContain('Text Item 1')
      expect(container.textContent).toContain('Text Item 2')

      transitionGroupView.dispose()
    })

    it('应该处理极短的持续时间', async () => {
      const items = ref([1])
      const onAfterEnter = vi.fn()

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        duration: 1,
        onAfterEnter,
        children: (item: number) =>
          createView('div', {
            id: `short-duration-item-${item}`,
            children: `Short Duration Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      items.value = [1, 2]
      await nextTick()
      await sleep(20)

      expect(onAfterEnter).toHaveBeenCalled()

      transitionGroupView.dispose()
    })

    it('应该处理零持续时间', async () => {
      const items = ref([1])
      const onAfterEnter = vi.fn()

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        duration: 0,
        onAfterEnter,
        children: (item: number) =>
          createView('div', {
            id: `zero-duration-item-${item}`,
            children: `Zero Duration Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      items.value = [1, 2]
      await nextTick()
      await sleep(20)

      expect(onAfterEnter).toHaveBeenCalled()

      transitionGroupView.dispose()
    })

    it('应该处理元素快速添加和删除', async () => {
      const items = ref([1])
      const onBeforeEnter = vi.fn()
      const onBeforeLeave = vi.fn()

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        onBeforeEnter,
        onBeforeLeave,
        duration: 0,
        children: (item: number) =>
          createView('div', {
            id: `fast-item-${item}`,
            children: `Fast Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      items.value = [1, 2]
      await nextTick()

      items.value = [1]
      await nextTick()

      expect(onBeforeEnter).toHaveBeenCalled()
      expect(onBeforeLeave).toHaveBeenCalled()

      transitionGroupView.dispose()
    })
  })

  describe('生命周期', () => {
    it('应该在销毁时正确清理资源', () => {
      const items = ref([1, 2, 3])

      const transitionGroupView = createView(TransitionGroup<number>, {
        each: items.value,
        children: (item: number) =>
          createView('div', {
            id: `lifecycle-item-${item}`,
            children: `Lifecycle Item ${item}`
          })
      })

      transitionGroupView.mount(container)

      expect(container.querySelector('#lifecycle-item-1')).toBeTruthy()
      expect(container.querySelector('#lifecycle-item-2')).toBeTruthy()
      expect(container.querySelector('#lifecycle-item-3')).toBeTruthy()

      transitionGroupView.dispose()

      expect(container.innerHTML).toBe('')
    })

    it('应该在多次挂载和销毁时正常工作', () => {
      const items = ref([1, 2])

      const transitionGroupView = createView(TransitionGroup<number>, {
        each: items.value,
        children: (item: number) =>
          createView('div', {
            id: `multi-lifecycle-item-${item}`,
            children: `Multi Lifecycle Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      expect(container.querySelector('#multi-lifecycle-item-1')).toBeTruthy()

      transitionGroupView.dispose()
      expect(container.innerHTML).toBe('')

      transitionGroupView.mount(container)
      expect(container.querySelector('#multi-lifecycle-item-1')).toBeTruthy()

      transitionGroupView.dispose()
      expect(container.innerHTML).toBe('')
    })
  })

  describe('取消钩子', () => {
    it('应该支持 onEnterCancelled 钩子', async () => {
      const items = ref([1])
      const onEnterCancelled = vi.fn()

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        onEnterCancelled,
        duration: 1000,
        children: (item: number) =>
          createView('div', {
            id: `cancel-enter-item-${item}`,
            children: `Cancel Enter Item ${item}`
          })
      })

      transitionGroupView.mount(container)
      await nextTick()

      items.value = [1, 2]
      await nextTick()
      items.value = [1]
      await nextTick()

      expect(onEnterCancelled).toHaveBeenCalled()

      transitionGroupView.dispose()
    })

    it('应该支持 onLeaveCancelled 钩子', async () => {
      const cached = new Map<number, View>()
      const items = ref([1, 2])
      const onLeaveCancelled = vi.fn()

      const transitionGroupView = createView(TransitionGroup<number>, {
        get each() {
          return items.value
        },
        onLeaveCancelled,
        duration: 10,
        children: (item: number) => {
          const cacheView = cached.get(item)
          if (cacheView) return cacheView
          const view = createView('div', {
            id: `cancel-leave-item-${item}`,
            children: `Cancel Leave Item ${item}`
          })
          cached.set(item, view)
          return view
        }
      })

      transitionGroupView.mount(container)

      await nextTick()
      items.value = [1]
      await nextTick()
      items.value = [1, 2]
      await nextTick()
      expect(onLeaveCancelled).toHaveBeenCalled()

      transitionGroupView.dispose()
    })
  })

  describe('key 函数', () => {
    it('应该支持自定义 key 函数', () => {
      interface Item {
        id: number
        name: string
      }
      const items = ref<Item[]>([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ])

      const transitionGroupView = createView(TransitionGroup<any>, {
        each: items.value,
        key: (item: Item) => item.id,
        children: (item: Item) =>
          createView('div', {
            id: `key-item-${item.id}`,
            children: item.name
          })
      })

      transitionGroupView.mount(container)

      expect(container.querySelector('#key-item-1')).toBeTruthy()
      expect(container.querySelector('#key-item-2')).toBeTruthy()

      transitionGroupView.dispose()
    })
  })
})
