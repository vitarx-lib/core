import { ref } from '@vitarx/responsive'
import { describe, expect, it, vi } from 'vitest'
import { CommentView, DynamicView, TextView, ViewKind } from '../../../src/index.js'
import {
  applyRef,
  bindProps,
  mergeDefaultProps,
  resolveChild,
  resolveChildren,
  resolveProps,
  SPECIAL_PROP_MERGERS
} from '../../../src/view/compiler/resolve.js'

describe('Compiler Resolve', () => {
  describe('SPECIAL_PROP_MERGERS', () => {
    it('应该包含特殊属性的合并函数', () => {
      expect(SPECIAL_PROP_MERGERS).toHaveProperty('style')
      expect(SPECIAL_PROP_MERGERS).toHaveProperty('class')
      expect(SPECIAL_PROP_MERGERS).toHaveProperty('className')
      expect(SPECIAL_PROP_MERGERS).toHaveProperty('classname')
    })

    it('合并函数应该是函数类型', () => {
      expect(typeof SPECIAL_PROP_MERGERS.style).toBe('function')
      expect(typeof SPECIAL_PROP_MERGERS.class).toBe('function')
    })
  })

  describe('bindProps', () => {
    it('应该合并绑定对象的属性到目标 props 中', () => {
      const props = { className: 'base' }
      const bind = { id: 'test', title: 'Test Title' }
      const result = bindProps(props, bind)

      expect(result).toHaveProperty('className')
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('title')
    })

    it('应该优先使用 props 中的属性', () => {
      const props = { className: 'base', id: 'props-id' }
      const bind = { id: 'bind-id', title: 'Test Title' }
      const result = bindProps(props, bind)

      expect(result.id).toBe('props-id')
      expect(result.title).toBe('Test Title')
    })

    it('应该支持数组形式的绑定，排除指定属性', () => {
      const props = { className: 'base' }
      const bind = [{ id: 'test', title: 'Test Title' }, ['title']]
      const result = bindProps(props, bind)

      expect(result).toHaveProperty('className')
      expect(result).toHaveProperty('id')
      expect(result).not.toHaveProperty('title')
    })

    it('应该正确处理特殊属性的合并', () => {
      const props = { className: 'base' }
      const bind = { className: 'bind' }
      const result = bindProps(props, bind)

      expect(result.className.join(' ')).toBe('base bind')
    })

    it('当绑定对象不是有效对象时应该返回原始 props', () => {
      const props = { className: 'base' }
      const invalidBindings = [null, undefined, 123, 'string', true]

      invalidBindings.forEach(bind => {
        const result = bindProps(props, bind as any)
        expect(result).toBe(props)
      })
    })
  })

  describe('resolveProps', () => {
    it('当 props 不存在时应该返回 { props: null }', () => {
      const result = resolveProps(null)

      expect(result).toEqual({ props: null })
    })

    it('应该提取 ref 属性', () => {
      const refFn = vi.fn()
      const props = { className: 'base', ref: refFn }
      const result = resolveProps(props)

      expect(result).toHaveProperty('ref')
      expect(result.ref).toBe(refFn)
      expect(result.props).not.toHaveProperty('ref')
    })

    it('应该处理 v-bind 属性', () => {
      const props = { className: 'base', 'v-bind': { id: 'test' } }
      const result = resolveProps(props)

      expect(result.props).toHaveProperty('className')
      expect(result.props).toHaveProperty('id')
    })

    it('当 ref 不是函数或 ref 时不应该包含在结果中', () => {
      const props = { className: 'base', ref: 'not-a-ref' }
      const result = resolveProps(props)

      expect(result).not.toHaveProperty('ref')
      expect(result.props).not.toHaveProperty('ref')
    })
  })

  describe('normalizeView', () => {
    it('当输入是 View 对象时应该直接返回', () => {
      const textView = new TextView('test')
      const result = resolveChild(textView)

      expect(result).toBe(textView)
    })

    it('当输入是 Ref 对象时应该包装为 DynamicView', () => {
      const textRef = ref('test')
      const result = resolveChild(textRef)

      expect(result).toBeInstanceOf(DynamicView)
      expect(result!.kind).toBe(ViewKind.DYNAMIC)
    })

    it('当输入是空字符串时应该返回 CommentView', () => {
      const result = resolveChild('')

      expect(result).toBeInstanceOf(CommentView)
      expect(result!.kind).toBe(ViewKind.COMMENT)
    })

    it('当输入是其他类型时应该转换为 null', () => {
      const testCases = [true, null, undefined, {}, Symbol('test')]
      testCases.forEach(input => {
        const result = resolveChild(input)
        expect(result).toBe(null)
      })
    })
  })

  describe('resolveChildren', () => {
    it('当 children 为 null 时应该返回空数组', () => {
      const result = resolveChildren(null)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('当 children 为单个值时应该返回包含一个元素的数组', () => {
      const result = resolveChildren('test')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
      expect(result[0]).toBeInstanceOf(TextView)
    })

    it('当 children 为数组时应该返回扁平化后的数组', () => {
      const result = resolveChildren(['test', 'another'])

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(2)
      expect(result[0]).toBeInstanceOf(TextView)
      expect(result[1]).toBeInstanceOf(TextView)
    })

    it('应该处理嵌套数组', () => {
      const result = resolveChildren(['test', ['nested', 'array']])

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(3)
      expect(result[0]).toBeInstanceOf(TextView)
      expect(result[1]).toBeInstanceOf(TextView)
      expect(result[2]).toBeInstanceOf(TextView)
    })

    it('应该过滤掉 null 和 undefined 值', () => {
      const result = resolveChildren(['test', null, 'another', undefined, 'last'])

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(3)
    })

    it('应该过滤掉 boolean 值', () => {
      const result = resolveChildren(['test', true, 'another', false, 'last'])

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(3)
    })
  })

  describe('applyRef', () => {
    it('当 ref 不存在时应该直接返回', () => {
      const el = document.createElement('div')
      expect(() => applyRef(null as any, el)).not.toThrow()
      expect(() => applyRef(undefined as any, el)).not.toThrow()
    })

    it('当 ref 是函数时应该调用该函数并传入元素', () => {
      const refFn = vi.fn()
      const el = document.createElement('div')
      applyRef(refFn, el)

      expect(refFn).toHaveBeenCalledWith(el)
    })

    it('当 ref 是对象时应该将元素的值赋给 ref 对象的 value 属性', () => {
      const refObj = { value: null }
      const el = document.createElement('div')
      applyRef(refObj as any, el)

      expect(refObj.value).toBe(el)
    })
  })

  describe('mergeDefaultProps', () => {
    it('当 props 为 null 且 defaultProps 不存在时应该返回空对象', () => {
      const result = mergeDefaultProps(null, undefined)

      expect(Array.isArray(result)).toBe(false)
      expect(Object.keys(result).length).toBe(0)
    })

    it('当 props 为 null 且 defaultProps 存在时应该返回 defaultProps', () => {
      const defaultProps = { className: 'default', id: 'default-id' }
      const result = mergeDefaultProps(null, defaultProps)

      expect(result).toEqual(defaultProps)
    })

    it('当 defaultProps 不是对象类型时应该直接返回 props', () => {
      const props = { className: 'base' }
      const invalidDefaultProps = [null, undefined, 123, 'string', true]

      invalidDefaultProps.forEach(defaultProps => {
        const result = mergeDefaultProps(props, defaultProps as any)
        expect(result).toBe(props)
      })
    })

    it('应该合并默认属性和传入属性，传入属性优先', () => {
      const props = { className: 'base', id: 'props-id' }
      const defaultProps = { id: 'default-id', title: 'Default Title' }
      const result = mergeDefaultProps(props, defaultProps)

      expect(result.className).toBe('base')
      expect(result.id).toBe('props-id')
      expect(result.title).toBe('Default Title')
    })
  })
})
