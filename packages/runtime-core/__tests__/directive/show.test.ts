import { beforeEach, describe, expect, it } from 'vitest'
import { show } from '../../src/directive/show.js'
import type { DirectiveBinding, RegularElementNode } from '../../src/index.js'
import { createTestElementVNode } from '../helpers/test-vnode.js'

describe('directive/show', () => {
  let mockElement: HTMLElement
  let vnode: RegularElementNode

  beforeEach(() => {
    // 创建一个真实的 DOM 元素
    mockElement = document.createElement('div')
    vnode = createTestElementVNode('div', {})
  })

  describe('指令定义', () => {
    it('应该定义 show 指令', () => {
      expect(show).toBeDefined()
      expect(show.name).toBe('show')
    })

    it('应该包含 created 钩子', () => {
      expect(show.created).toBeDefined()
      expect(typeof show.created).toBe('function')
    })

    it('应该包含 updated 钩子', () => {
      expect(show.updated).toBeDefined()
      expect(typeof show.updated).toBe('function')
    })

    it('应该包含 unmounted 钩子', () => {
      expect(show.unmounted).toBeDefined()
      expect(typeof show.unmounted).toBe('function')
    })
  })

  describe('created 钩子功能', () => {
    it('当 value 为 true 时，不应该设置 display: none', () => {
      const binding: DirectiveBinding = { value: true, oldValue: undefined, arg: undefined }

      show.created!(mockElement, binding, vnode)

      expect(mockElement.style.display).not.toBe('none')
    })

    it('当 value 为 false 时，应该设置 display: none', () => {
      const binding: DirectiveBinding = { value: false, oldValue: undefined, arg: undefined }

      show.created!(mockElement, binding, vnode)

      expect(mockElement.style.display).toBe('none')
    })

    it('当 value 为 0 时，应该设置 display: none', () => {
      const binding: DirectiveBinding = { value: 0, oldValue: undefined, arg: undefined }

      show.created!(mockElement, binding, vnode)

      expect(mockElement.style.display).toBe('none')
    })

    it('当 value 为空字符串时，应该设置 display: none', () => {
      const binding: DirectiveBinding = { value: '', oldValue: undefined, arg: undefined }

      show.created!(mockElement, binding, vnode)

      expect(mockElement.style.display).toBe('none')
    })

    it('当 value 为 null 时，应该设置 display: none', () => {
      const binding: DirectiveBinding = { value: null, oldValue: undefined, arg: undefined }

      show.created!(mockElement, binding, vnode)

      expect(mockElement.style.display).toBe('none')
    })

    it('当 value 为 undefined 时，应该设置 display: none', () => {
      const binding: DirectiveBinding = { value: undefined, oldValue: undefined, arg: undefined }

      show.created!(mockElement, binding, vnode)

      expect(mockElement.style.display).toBe('none')
    })
  })

  describe('updated 钩子功能', () => {
    it('从 true 切换到 false 时，应该设置 display: none', () => {
      const binding: DirectiveBinding = { value: false, oldValue: true, arg: undefined }

      show.updated!(mockElement, binding, vnode)

      expect(mockElement.style.display).toBe('none')
    })

    it('从 false 切换到 true 时，应该移除 display: none', () => {
      // 先设置为 none
      mockElement.style.display = 'none'

      const binding: DirectiveBinding = { value: true, oldValue: false, arg: undefined }
      show.updated!(mockElement, binding, vnode)

      expect(mockElement.style.display).not.toBe('none')
    })

    it('从 false 切换到 true 时，应该恢复原有的 display 值', () => {
      vnode.props.style = { display: 'flex' }
      mockElement.style.display = 'none'

      const binding: DirectiveBinding = { value: true, oldValue: false, arg: undefined }
      show.updated!(mockElement, binding, vnode)

      expect(mockElement.style.display).toBe('flex')
    })

    it('从 false 切换到 true 且无原 display 值时，应该移除 display 样式', () => {
      mockElement.style.display = 'none'

      const binding: DirectiveBinding = { value: true, oldValue: false, arg: undefined }
      show.updated!(mockElement, binding, vnode)

      expect(mockElement.style.display).toBe('')
    })

    it('多次切换应该正常工作', () => {
      // false -> 隐藏
      show.updated!(mockElement, { value: false, oldValue: true, arg: undefined }, vnode)
      expect(mockElement.style.display).toBe('none')

      // true -> 显示
      show.updated!(mockElement, { value: true, oldValue: false, arg: undefined }, vnode)
      expect(mockElement.style.display).toBe('')

      // false -> 隐藏
      show.updated!(mockElement, { value: false, oldValue: true, arg: undefined }, vnode)
      expect(mockElement.style.display).toBe('none')
    })
  })

  describe('unmounted 钩子功能', () => {
    it('当 value 为 true 时，应该清理 display 样式', () => {
      mockElement.style.display = 'block'

      const binding: DirectiveBinding = { value: true, oldValue: true, arg: undefined }
      show.unmounted!(mockElement, binding, vnode)

      expect(mockElement.style.display).toBe('')
    })

    it('当 value 为 true 且有原 display 值时，应该恢复原值', () => {
      vnode.props.style = { display: 'inline-block' }
      mockElement.style.display = 'block'

      const binding: DirectiveBinding = { value: true, oldValue: true, arg: undefined }
      show.unmounted!(mockElement, binding, vnode)

      expect(mockElement.style.display).toBe('inline-block')
    })

    it('当 value 为 false 时，不应该修改 display', () => {
      mockElement.style.display = 'none'

      const binding: DirectiveBinding = { value: false, oldValue: false, arg: undefined }
      show.unmounted!(mockElement, binding, vnode)

      expect(mockElement.style.display).toBe('none')
    })
  })

  describe('边界情况', () => {
    it('应该处理元素本身有 display 样式的情况', () => {
      vnode.props.style = { display: 'grid' }
      mockElement.style.display = 'grid'

      // 隐藏
      show.updated!(mockElement, { value: false, oldValue: true, arg: undefined }, vnode)
      expect(mockElement.style.display).toBe('none')

      // 显示 - 应该恢复为 grid
      show.updated!(mockElement, { value: true, oldValue: false, arg: undefined }, vnode)
      expect(mockElement.style.display).toBe('grid')
    })

    it('应该处理 truthy 值', () => {
      const binding: DirectiveBinding = { value: 'any string', oldValue: undefined, arg: undefined }

      show.created!(mockElement, binding, vnode)

      expect(mockElement.style.display).not.toBe('none')
    })

    it('应该处理 falsy 值', () => {
      const falsyValues = [false, 0, '', null, undefined, NaN]

      falsyValues.forEach(value => {
        const el = document.createElement('div')
        const binding: DirectiveBinding = { value, oldValue: undefined, arg: undefined }

        show.created!(el, binding, vnode)

        expect(el.style.display).toBe('none')
      })
    })
  })

  describe('与 Vue v-show 行为一致性', () => {
    it('应该像 v-show 一样通过 display 控制显示隐藏', () => {
      // 初始显示
      const binding1: DirectiveBinding = { value: true, oldValue: undefined, arg: undefined }
      show.created!(mockElement, binding1, vnode)
      expect(mockElement.style.display).not.toBe('none')

      // 切换隐藏
      const binding2: DirectiveBinding = { value: false, oldValue: true, arg: undefined }
      show.updated!(mockElement, binding2, vnode)
      expect(mockElement.style.display).toBe('none')

      // 切换显示
      const binding3: DirectiveBinding = { value: true, oldValue: false, arg: undefined }
      show.updated!(mockElement, binding3, vnode)
      expect(mockElement.style.display).not.toBe('none')
    })

    it('应该保留元素原有的 display 样式', () => {
      vnode.props.style = { display: 'inline-flex' }

      // 隐藏
      show.updated!(mockElement, { value: false, oldValue: true, arg: undefined }, vnode)
      expect(mockElement.style.display).toBe('none')

      // 显示 - 应该恢复为 inline-flex
      show.updated!(mockElement, { value: true, oldValue: false, arg: undefined }, vnode)
      expect(mockElement.style.display).toBe('inline-flex')
    })
  })
})
