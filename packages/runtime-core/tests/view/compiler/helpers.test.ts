import { isRef, ref } from '@vitarx/responsive'
import { describe, expect, it } from 'vitest'
import { accessor, branch, dynamic, expr, isDynamicView, ViewKind } from '../../../src/index.js'

describe('Compiler Helpers', () => {
  describe('branch', () => {
    it('当条件不含响应式依赖时应该直接返回分支值', () => {
      const result = branch(() => 0, [() => 'branch 0', () => 'branch 1'])

      expect(result).toBe('branch 0')
      expect(isRef(result)).toBeFalsy()
    })

    it('当条件不含响应式依赖且返回 null 时应该返回 null', () => {
      const result = branch(() => null, [() => 'branch 0'])

      expect(result).toBe(null)
    })

    it('当条件包含响应式依赖时应该返回 Ref', () => {
      const idx = ref(0)
      const result = branch(
        () => (idx.value === 0 ? 0 : idx.value === 1 ? 1 : null),
        [() => 'A', () => 'B']
      )

      expect(isRef(result)).toBeTruthy()
      expect((result as any).value).toBe('A')
    })

    it('应该根据响应式条件切换分支结果', () => {
      const idx = ref(0)
      const result = branch(
        () => (idx.value === 0 ? 0 : idx.value === 1 ? 1 : null),
        [() => 'A', () => 'B']
      )

      expect((result as any).value).toBe('A')
      idx.value = 1
      expect((result as any).value).toBe('B')
      idx.value = 2
      expect((result as any).value).toBe(null)
    })
  })

  describe('accessor', () => {
    it('当属性不是响应式时应该直接返回值', () => {
      const obj = { name: 'test' }
      const result = accessor(obj, 'name')

      expect(result).toBe('test')
      expect(isRef(result)).toBeFalsy()
    })

    it('当属性是响应式时应该返回 Ref', () => {
      const r = ref(true)
      const obj = {
        get name() {
          return r.value ? 'test' : 'updated'
        }
      }
      const result = accessor(obj, 'name')

      expect(isRef(result)).toBe(true)
    })
  })

  describe('dynamic', () => {
    it('应该创建 DynamicView 实例', () => {
      const view = dynamic(() => 'test')

      expect(isDynamicView(view)).toBeTruthy()
      expect(view.kind).toBe(ViewKind.DYNAMIC)
    })

    it('即使不含响应式依赖也应创建 DynamicView', () => {
      const view = dynamic(() => 'static')

      expect(isDynamicView(view)).toBeTruthy()
      expect(view.kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该追踪响应式依赖', () => {
      const count = ref(true)
      const view = dynamic(() => (count.value ? 'true' : 'false'))

      expect(view.kind).toBe(ViewKind.DYNAMIC)
    })
  })

  describe('expr', () => {
    it('当表达式为字面量时应该直接返回值', () => {
      expect(expr(() => 'static')).toBe('static')
      expect(expr(() => 42)).toBe(42)
      expect(expr(() => null)).toBe(null)
      expect(expr(() => undefined)).toBe(undefined)
    })

    it('当属性访问不含响应式依赖时应该直接返回计算值', () => {
      const obj = { name: 'test', count: 1 }
      expect(expr(() => obj.name)).toBe('test')
      expect(expr(() => obj.count + 10)).toBe(11)
      expect(isRef(expr(() => obj.name))).toBeFalsy()
    })

    it('当函数调用返回静态值时应该直接返回结果', () => {
      const fn = () => 'hello'
      expect(expr(fn)).toBe('hello')
    })

    it('当表达式包含 ref 访问时应该返回 Ref', () => {
      const count = ref(1)
      const result = expr(() => count.value)

      expect(isRef(result)).toBeTruthy()
      expect((result as any).value).toBe(1)
    })

    it('当表达式包含 ref 运算时应该返回 Ref', () => {
      const count = ref(1)
      const result = expr(() => count.value + 1)

      expect(isRef(result)).toBeTruthy()
      expect((result as any).value).toBe(2)
    })

    it('当属性访问涉及响应式依赖时应该返回 Ref', () => {
      const r = ref('Alice')
      const obj = {
        get name() {
          return r.value
        }
      }
      const result = expr(() => obj.name)

      expect(isRef(result)).toBeTruthy()
      expect((result as any).value).toBe('Alice')
    })

    it('逻辑表达式包含响应式依赖时应该返回 Ref', () => {
      const show = ref(true)
      const result = expr(() => (show.value ? 'yes' : 'no'))

      expect(isRef(result)).toBeTruthy()
      expect((result as any).value).toBe('yes')
    })
  })
})
