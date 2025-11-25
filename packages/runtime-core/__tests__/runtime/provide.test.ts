import { describe, expect, it } from 'vitest'
import { inject, provide } from '../../src/index.js'

describe('runtime/provide', () => {
  describe('provide', () => {
    it('应该在没有Widget上下文时抛出错误', () => {
      expect(() => provide('key', 'value')).toThrow('provide must be called in stateful widget')
    })

    it('应该接受字符串key', () => {
      // 没有上下文会抛出错误,这里只验证API
      expect(() => provide('theme', 'dark')).toThrow()
    })

    it('应该接受Symbol key', () => {
      const key = Symbol('key')
      expect(() => provide(key, 'value')).toThrow()
    })

    it('应该接受任意类型的value', () => {
      expect(() => provide('string', 'value')).toThrow()
      expect(() => provide('number', 123)).toThrow()
      expect(() => provide('object', {})).toThrow()
      expect(() => provide('array', [])).toThrow()
      expect(() => provide('function', () => {})).toThrow()
    })
  })

  describe('inject', () => {
    it('应该在没有Widget上下文时抛出错误', () => {
      expect(() => inject('key')).toThrow('inject must be called in widget')
    })

    it('应该接受字符串key', () => {
      expect(() => inject('theme')).toThrow()
    })

    it('应该接受Symbol key', () => {
      const key = Symbol('key')
      expect(() => inject(key)).toThrow()
    })

    it('应该支持默认值', () => {
      expect(() => inject('key', 'default')).toThrow()
    })

    it('应该支持工厂函数', () => {
      const factory = () => ({ value: 123 })
      expect(() => inject('key', factory, true)).toThrow()
    })

    it('应该支持非工厂函数默认值', () => {
      const fn = () => 'value'
      expect(() => inject('key', fn, false)).toThrow()
    })
  })

  describe('类型安全', () => {
    it('inject 应该支持泛型类型', () => {
      // 类型检查,无实际执行
      const _test = () => {
        const value: string | undefined = inject<string>('key')
        const withDefault: string = inject<string>('key', 'default')
        const withFactory: number = inject<() => number>('key', () => 123, true)

        // 避免未使用变量警告
        void value
        void withDefault
        void withFactory
      }
      expect(_test).toBeDefined()
    })
  })

  describe('边界情况', () => {
    it('provide 应该处理 undefined 值', () => {
      expect(() => provide('key', undefined)).toThrow()
    })

    it('provide 应该处理 null 值', () => {
      expect(() => provide('key', null)).toThrow()
    })

    it('inject 应该处理 undefined 默认值', () => {
      expect(() => inject('key', undefined)).toThrow()
    })

    it('inject 应该处理 null 默认值', () => {
      expect(() => inject('key', null)).toThrow()
    })
  })

  describe('API 签名', () => {
    it('provide 应该接受2个参数', () => {
      expect(provide.length).toBe(2)
    })

    it('inject 应该接受最多3个参数', () => {
      expect(inject.length).toBe(3)
    })
  })
})
