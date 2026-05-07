import { ref } from '@vitarx/responsive'
import { createTextView, isDynamicView, isTextView, ViewKind } from '../../../src/index.js'
import { resolveChild, resolveChildren } from '../../../src/view/compiler/utils.js'
import { applyRef } from '../../../src/view/implements/base.js'

describe('Compiler Utils', () => {
  describe('resolveChild', () => {
    it('当输入是 View 对象时应该直接返回', () => {
      const textView = createTextView('test')
      const result = resolveChild(textView)

      expect(result).toBe(textView)
    })

    it('当输入是 Ref 对象时应该包装为 DynamicView', () => {
      const textRef = ref('test')
      const result = resolveChild(textRef)

      expect(isDynamicView(result)).toBeTruthy()
      expect(result!.kind).toBe(ViewKind.DYNAMIC)
    })

    it('当输入是空字符串时应该返回 Null', () => {
      const result = resolveChild('')
      expect(result).toBeNull()
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
      expect(isTextView(result[0])).toBeTruthy()
    })

    it('当 children 为数组时应该返回扁平化后的数组', () => {
      const result = resolveChildren(['test', 'another'])

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(2)
      expect(isTextView(result[0])).toBeTruthy()
      expect(isTextView(result[1])).toBeTruthy()
    })

    it('应该处理嵌套数组', () => {
      const result = resolveChildren(['test', ['nested', 'array']])

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(3)
      expect(isTextView(result[0])).toBeTruthy()
      expect(isTextView(result[1])).toBeTruthy()
      expect(isTextView(result[2])).toBeTruthy()
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
})
