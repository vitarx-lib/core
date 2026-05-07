import { describe, expect, it, vi } from 'vitest'
import { bindProps, mergeProps, resolveProps } from '../../../src/view/compiler/props.js'

describe('Props utils', () => {
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
      const props = { class: 'base' }
      const bind = [{ id: 'test', title: 'Test Title' }, ['title']]
      const result = bindProps(props, bind)

      expect(result).toHaveProperty('class')
      expect(result).toHaveProperty('id')
      expect(result).not.toHaveProperty('title')
    })

    it('应该正确处理特殊属性的合并', () => {
      const props = { class: 'base' }
      const bind = { class: 'bind' }
      const result = bindProps(props, bind)

      expect(result.class.join(' ')).toBe('base bind')
    })

    it('当绑定对象不是有效对象时应该返回原始 props', () => {
      const props = { class: 'base' }
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
      // 数组类型v-bind
      const props2 = { className: 'base', 'v-bind': [{ id: 'test', test: 'test' }, ['test']] }
      const result2 = resolveProps(props2)
      expect(result2.props).toHaveProperty('className')
      expect(result2.props).toHaveProperty('id')
      expect(result2.props).not.toHaveProperty('test')
    })

    it('当 ref 不是函数或 ref 时不应该包含在结果中', () => {
      const props = { className: 'base', ref: 'not-a-ref' }
      const result = resolveProps(props)

      expect(result).not.toHaveProperty('ref')
      expect(result.props).not.toHaveProperty('ref')
    })
  })

  describe('mergeProps', () => {
    it('应该合并默认属性和传入属性，传入属性优先', () => {
      const props = { className: 'base', id: 'props-id' }
      const defaultProps = { id: 'default-id', title: 'Default Title' }
      const result = mergeProps(defaultProps, props)

      expect(result.className).toBe('base')
      expect(result.id).toBe('props-id')
      expect(result.title).toBe('Default Title')
    })
  })
})
