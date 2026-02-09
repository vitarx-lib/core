import { nextTick, ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { HostElementTag } from '../../../types/index.js'
import { createView } from '../../../view/index.js'
import { For } from '../src/index.js'

describe('For Component', () => {
  let container: HTMLElement
  const testTag = 'div' as HostElementTag

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    container.innerHTML = ''
  })

  describe('属性验证', () => {
    it('应该验证 each 必须为数组', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        For.validateProps({
          each: 'not an array' as any,
          children: (item: any) => createView(testTag),
          key: (item: any, index: number) => index
        })
      }).toThrowError()
    })

    it('应该验证 children 必须为函数', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        For.validateProps({
          each: [],
          children: 'not a function' as any,
          key: (item: any, index: number) => index
        })
      }).toThrowError()
    })

    it('应该验证 key 类型正确性', () => {
      // 测试有效的 key 类型
      expect(() => {
        // @ts-expect-error - Testing invalid input
        For.validateProps({
          each: [],
          children: (item: any) => createView(testTag),
          key: (item: any) => item.id // 函数类型
        })
      }).not.toThrow()

      expect(() => {
        // @ts-expect-error - Testing invalid input
        For.validateProps({
          each: [{ id: 1 }],
          children: (item: any) => createView(testTag),
          key: 'id' // 字符串类型（属性名）
        })
      }).not.toThrow()

      // 测试无效的 key 类型
      expect(() => {
        // @ts-expect-error - Testing invalid input
        For.validateProps({
          each: [],
          children: (item: any) => createView(testTag),
          key: 123 as any // 数字类型应该是无效的
        })
      }).toThrow()
    })

    it('应该接受有效的 props', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        For.validateProps({
          each: [1, 2, 3],
          children: (item: any) => createView(testTag, { children: item }),
          key: (item: any, index: number) => index
        })
      }).not.toThrow()
    })
  })

  describe('基础功能', () => {
    it('应该正确渲染列表项', () => {
      const items = ['apple', 'banana', 'cherry']

      const view = createView(For<string>, {
        each: items,
        key: item => item,
        children: (item: string, index) =>
          createView(testTag, {
            children: `${item}-${index}`
          })
      })

      view.mount(container)

      expect(container.textContent).toBe('apple-0banana-1cherry-2')
    })

    it('应该使用 key 函数正确生成键值', () => {
      const items = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ] as const

      const view = createView(For<{ id: number; name: string }>, {
        each: items,
        key: (item: { id: number; name: string }) => item.id,
        children: (item: { id: number; name: string }) =>
          createView(testTag, {
            children: item.name
          })
      })

      view.mount(container)

      expect(container.textContent).toBe('AliceBob')
    })

    it('应该支持索引参数', () => {
      const items = ['first', 'second', 'third']

      const view = createView(For<string>, {
        each: items,
        key: item => item,
        children: (item: string, index) =>
          createView(testTag, {
            children: `${item}-${index}`
          })
      })

      view.mount(container)

      expect(container.textContent).toBe('first-0second-1third-2')
    })

    it('应该正确处理空数组', () => {
      const view = createView(For, {
        each: [],
        key: (item: any) => item,
        children: (item: any) =>
          createView(testTag, {
            children: item
          })
      })

      view.mount(container)

      expect(container.textContent).toBe('')
    })
  })

  describe('列表更新', () => {
    it('应该响应数据变化并更新列表', async () => {
      const items = ref(['a', 'b'])

      const view = createView(For<string>, {
        get each() {
          return items.value
        },
        key: (item: string) => item,
        children: (item: string) =>
          createView(testTag, {
            children: item
          })
      })

      view.mount(container)

      expect(container.textContent).toBe('ab')
      // 重新排序
      items.value.reverse()
      await nextTick()
      expect(container.textContent).toBe('ba')
      items.value = ['x', 'y', 'z']
      await nextTick()
      expect(container.textContent).toBe('xyz')
    })

    it('应该正确处理列表项的添加', async () => {
      const items = ref(['a'])

      const view = createView(For<string>, {
        get each() {
          return items.value
        },
        key: (item: string) => item,
        children: (item: string) =>
          createView(testTag, {
            children: item
          })
      })

      view.mount(container)
      expect(container.textContent).toBe('a')
      items.value.push('b', 'c')
      await nextTick()
      expect(container.textContent).toBe('abc')
    })

    it('应该正确处理列表项的删除', async () => {
      const items = ref(['a', 'b', 'c'])

      const view = createView(For<string>, {
        get each() {
          return items.value
        },
        key: (item: string) => item,
        children: (item: string) =>
          createView(testTag, {
            children: item
          })
      })

      view.mount(container)

      expect(container.textContent).toBe('abc')
      items.value.length = 1
      await nextTick()
      expect(container.textContent).toBe('a')
    })
  })

  describe('复杂数据结构', () => {
    it('应该处理嵌套对象数组', () => {
      const items = [
        { id: 1, user: { name: 'Alice', age: 25 } },
        { id: 2, user: { name: 'Bob', age: 30 } }
      ]

      const view = createView(For<any>, {
        each: items,
        key: (item: (typeof items)[0]) => item.id,
        children: (item: (typeof items)[0]) =>
          createView(testTag, {
            children: `${item.user.name}-${item.user.age}`
          })
      })

      view.mount(container)

      expect(container.textContent).toBe('Alice-25Bob-30')
    })

    it('应该处理数字数组', () => {
      const items = [10, 20, 30]

      const view = createView(For<number>, {
        each: items,
        key: item => item,
        children: (item: number) =>
          createView(testTag, {
            children: `num-${item}`
          })
      })

      view.mount(container)

      expect(container.textContent).toBe('num-10num-20num-30')
    })
  })

  describe('生命周期', () => {
    it('应该在组件销毁时清理相关资源', () => {
      const items = ['a', 'b', 'c']

      const view = createView(For<string>, {
        each: items,
        key: (item: string) => item,
        children: (item: string) =>
          createView(testTag, {
            children: item
          })
      })

      view.mount(container)

      expect(container.textContent).toBe('abc')

      // 销毁组件
      view.dispose()

      expect(container.innerHTML).toBe('')
    })
  })

  describe('边界场景', () => {
    it('应该处理单个元素的数组', () => {
      const items = ['single']

      const view = createView(For<string>, {
        each: items,
        key: (item: string) => item,
        children: (item: string) =>
          createView(testTag, {
            children: item
          })
      })

      view.mount(container)

      expect(container.textContent).toBe('single')
    })

    it('应该处理不同类型的数组元素', () => {
      const items = [1, 'two', true, null]

      const view = createView(For, {
        each: items,
        key: (item: any) => item,
        children: (item: any) =>
          createView(testTag, {
            children: String(item)
          })
      })

      view.mount(container)

      expect(container.textContent).toBe('1twotruenull')
    })

    it('应该在没有提供key时显示优化的警告信息', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const items = ['apple', 'banana']

      const view = createView(For<string>, {
        each: items,
        // 故意不提供 key prop
        children: (item: string) =>
          createView(testTag, {
            children: item
          })
      })

      view.mount(container)

      // 验证警告信息包含优化后的内容
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('key prop is not provided'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('While not mandatory'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Consider adding a unique key'))

      warnSpy.mockRestore()
    })
  })
})
