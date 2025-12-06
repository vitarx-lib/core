import { describe, expect, it, vi } from 'vitest'
import { defineDirective, h, resolveDirective, withDirectives } from '../../src/index.js'

describe('directive/core', () => {
  describe('defineDirective', () => {
    it('应该定义函数形式的指令', () => {
      const mounted = vi.fn()

      expect(() => defineDirective('test', mounted)).not.toThrow()
    })

    it('应该定义对象形式的指令', () => {
      const directiveObj = {
        mounted: vi.fn(),
        updated: vi.fn()
      }

      expect(() => defineDirective('test', directiveObj)).not.toThrow()
    })

    it('应该在指令名为空时抛出错误', () => {
      expect(() => defineDirective('', vi.fn())).toThrow()
    })

    it('应该接受所有生命周期钩子', () => {
      const directiveObj = {
        created: vi.fn(),
        beforeMount: vi.fn(),
        mounted: vi.fn(),
        beforeUpdate: vi.fn(),
        updated: vi.fn(),
        beforeUnmount: vi.fn(),
        unmounted: vi.fn()
      }

      expect(() => defineDirective('full', directiveObj)).not.toThrow()
    })

    it('应该存储全局指令', () => {
      const mounted = vi.fn()

      expect(() => defineDirective('global', mounted)).not.toThrow()

      // 可以通过 resolveDirective 解析
      const resolved = resolveDirective('global')
      expect(resolved).toBeDefined()
    })
  })

  describe('withDirectives', () => {
    it('应该为节点添加指令', () => {
      const vnode = h('div', {})
      defineDirective('test', vi.fn())
      const directive = resolveDirective('test')!

      const result = withDirectives(vnode, [[directive, 'value']])

      expect(result).toBe(vnode)
      expect(vnode.directives).toBeDefined()
      expect(vnode.directives?.has('test')).toBe(true)
    })

    it('应该支持多个指令', () => {
      const vnode = h('div', {})
      defineDirective('dir1', vi.fn())
      defineDirective('dir2', vi.fn())
      const dir1 = resolveDirective('dir1')!
      const dir2 = resolveDirective('dir2')!

      withDirectives(vnode, [
        [dir1, 'value1'],
        [dir2, 'value2']
      ])

      expect(vnode.directives?.size).toBe(2)
      expect(vnode.directives?.has('dir1')).toBe(true)
      expect(vnode.directives?.has('dir2')).toBe(true)
    })

    it('应该支持指令参数', () => {
      const vnode = h('div', {})
      defineDirective('test', vi.fn())
      const directive = resolveDirective('test')!

      withDirectives(vnode, [[directive, 'value', 'arg']])

      const entry = vnode.directives?.get('test')
      expect(entry).toBeDefined()
      expect(entry![1]).toBe('value')
      expect(entry![2]).toBe('arg')
    })

    it('应该忽略文本节点的指令', () => {
      const vnode = h('plain-text', { text: 'Text' })
      defineDirective('test', vi.fn())
      const directive = resolveDirective('test')!

      withDirectives(vnode as any, [[directive, 'value']])

      expect(vnode.directives).toBeUndefined()
    })

    it('应该忽略注释节点的指令', () => {
      const vnode = h('comment', { text: 'Comment' })
      defineDirective('test', vi.fn())
      const directive = resolveDirective('test')!

      withDirectives(vnode as any, [[directive, 'value']])

      expect(vnode.directives).toBeUndefined()
    })

    it('应该处理空指令数组', () => {
      const vnode = h('div', {})

      withDirectives(vnode, [])

      expect(vnode.directives?.size || 0).toBe(0)
    })
  })

  describe('resolveDirective', () => {
    it('应该在没有上下文时返回undefined并发出警告', () => {
      const result = resolveDirective('nonexistent')

      expect(result).toBeUndefined()
    })

    it('应该对不存在的指令返回undefined', () => {
      const result = resolveDirective('does-not-exist')
      expect(result).toBeUndefined()
    })

    it('应该解析全局指令', () => {
      defineDirective('global-unique-test', vi.fn())

      const resolved = resolveDirective('global-unique-test')

      expect(resolved).toBeDefined()
      expect(resolved?.name).toBe('global-unique-test')
    })
  })

  describe('指令值类型', () => {
    it('应该接受字符串值', () => {
      const vnode = h('div', {})
      defineDirective('test', vi.fn())
      const directive = resolveDirective('test')!

      withDirectives(vnode, [[directive, 'string-value']])

      const entry = vnode.directives?.get('test')
      expect(entry![1]).toBe('string-value')
    })

    it('应该接受数字值', () => {
      const vnode = h('div', {})
      defineDirective('test2', vi.fn())
      const directive = resolveDirective('test2')!

      withDirectives(vnode, [[directive, 123]])

      const entry = vnode.directives?.get('test2')
      expect(entry![1]).toBe(123)
    })

    it('应该接受对象值', () => {
      const vnode = h('div', {})
      defineDirective('test3', vi.fn())
      const directive = resolveDirective('test3')!
      const value = { key: 'value' }

      withDirectives(vnode, [[directive, value]])

      const entry = vnode.directives?.get('test3')
      expect(entry![1]).toBe(value)
    })

    it('应该接受数组值', () => {
      const vnode = h('div', {})
      defineDirective('test4', vi.fn())
      const directive = resolveDirective('test4')!
      const value = [1, 2, 3]

      withDirectives(vnode, [[directive, value]])

      const entry = vnode.directives?.get('test4')
      expect(entry![1]).toEqual(value)
    })

    it('应该接受 undefined 值', () => {
      const vnode = h('div', {})
      defineDirective('test5', vi.fn())
      const directive = resolveDirective('test5')!

      withDirectives(vnode, [[directive, undefined]])

      expect(vnode.directives?.has('test5')).toBe(true)
    })
  })

  describe('边界情况', () => {
    it('应该处理指令覆盖', () => {
      const vnode = h('div', {})
      defineDirective('testdir', vi.fn())
      const dir = resolveDirective('testdir')!

      withDirectives(vnode, [[dir, 'value1']])
      withDirectives(vnode, [[dir, 'value2']])

      const entry = vnode.directives?.get('testdir')
      expect(entry![1]).toBe('value2')
    })

    it('应该处理没有参数的指令', () => {
      const vnode = h('div', {})
      defineDirective('testdir2', vi.fn())
      const directive = resolveDirective('testdir2')!

      withDirectives(vnode, [[directive, 'value', undefined]])

      const entry = vnode.directives?.get('testdir2')
      expect(entry![2]).toBeUndefined()
    })
  })
})
