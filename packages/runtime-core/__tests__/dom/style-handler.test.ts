import { ref } from '@vitarx/responsive'
import { StyleHandler, type StyleRules } from '../../src/index.js'

describe('StyleHandler', () => {
  describe('mergeCssClass', () => {
    it('应该合并两个字符串类型的class', () => {
      const result = StyleHandler.mergeCssClass('class1 class2', 'class3 class4')
      expect(result).toEqual(['class1', 'class2', 'class3', 'class4'])
    })

    it('应该合并字符串和数组类型的class', () => {
      const result = StyleHandler.mergeCssClass('class1 class2', ['class3', 'class4'])
      expect(result).toEqual(['class1', 'class2', 'class3', 'class4'])
    })

    it('应该合并字符串和对象类型的class', () => {
      const result = StyleHandler.mergeCssClass('class1 class2', {
        class3: true,
        class4: false,
        class5: true
      })
      expect(result).toEqual(['class1', 'class2', 'class3', 'class5'])
    })

    it('应该合并数组和对象类型的class', () => {
      const result = StyleHandler.mergeCssClass(['class1', 'class2'], {
        class3: true,
        class4: false,
        class5: true
      })
      expect(result).toEqual(['class1', 'class2', 'class3', 'class5'])
    })

    it('应该合并两个数组并去重', () => {
      const result = StyleHandler.mergeCssClass(
        ['class1', 'class2', 'class1'],
        ['class2', 'class3']
      )
      expect(result).toEqual(['class1', 'class2', 'class3'])
    })

    it('应该合并两个对象并去重', () => {
      const result = StyleHandler.mergeCssClass(
        { class1: true, class2: true, class3: false },
        { class2: false, class3: true, class4: true }
      )
      expect(result).toEqual(['class1', 'class2', 'class3', 'class4'])
    })
  })

  describe('mergeCssStyle', () => {
    it('应该合并两个字符串类型的样式', () => {
      const result = StyleHandler.mergeCssStyle(
        'color: red; font-size: 14px',
        'background: blue; color: green'
      )
      expect(result).toEqual({ color: 'green', fontSize: '14px', background: 'blue' })
    })

    it('应该合并字符串和对象类型的样式', () => {
      const result = StyleHandler.mergeCssStyle('color: red; font-size: 14px', {
        background: 'blue',
        color: 'green'
      })
      expect(result).toEqual({ color: 'green', fontSize: '14px', background: 'blue' })
    })

    it('应该合并两个对象，后面的值覆盖前面的值', () => {
      const result = StyleHandler.mergeCssStyle(
        { color: 'red', fontSize: '14px' },
        { background: 'blue', color: 'green' }
      )
      expect(result).toEqual({ color: 'green', fontSize: '14px', background: 'blue' })
    })
  })

  describe('cssStyleValueToString', () => {
    it('对于null或undefined应该返回空字符串', () => {
      expect(StyleHandler.cssStyleValueToString(null as any)).toBe('')
      expect(StyleHandler.cssStyleValueToString(undefined as any)).toBe('')
    })

    it('对于字符串应该原样返回', () => {
      expect(StyleHandler.cssStyleValueToString('color: red')).toBe('color: red')
    })

    it('对于非对象值应该返回空字符串', () => {
      expect(StyleHandler.cssStyleValueToString(123 as any)).toBe('')
      expect(StyleHandler.cssStyleValueToString(true as any)).toBe('')
    })

    it('应该将对象转换为样式字符串', () => {
      const styleObj = { color: 'red', fontSize: '14px', backgroundColor: 'blue' }
      const result = StyleHandler.cssStyleValueToString(styleObj)
      expect(result).toBe('color: red; font-size: 14px; background-color: blue')
    })

    it('应该忽略对象中的无效值', () => {
      const styleObj = { color: 'red', fontSize: null, backgroundColor: 'blue', invalid: undefined }
      const result = StyleHandler.cssStyleValueToString(styleObj as any)
      expect(result).toBe('color: red; background-color: blue')
    })

    it('应该处理数字值', () => {
      const styleObj: StyleRules = { fontSize: '14', opacity: 0.5 }
      const result = StyleHandler.cssStyleValueToString(styleObj)
      expect(result).toBe('font-size: 14; opacity: 0.5')
    })

    it('应该使用toRaw来解包值', () => {
      const mockValue = ref('red')

      const styleObj = { color: mockValue }
      const result = StyleHandler.cssStyleValueToString(styleObj)
      expect(result).toBe('color: red')
    })
  })

  describe('cssStyleValueToObject', () => {
    it('应该将字符串样式解析为对象', () => {
      const result = StyleHandler.cssStyleValueToObject(
        'color: red; font-size: 14px; background-color: blue'
      )
      expect(result).toEqual({ color: 'red', fontSize: '14px', backgroundColor: 'blue' })
    })

    it('应该原样返回对象', () => {
      const styleObj = { color: 'red', fontSize: '14px' }
      const result = StyleHandler.cssStyleValueToObject(styleObj)
      expect(result).toBe(styleObj)
    })

    it('对于非字符串和非对象值应该返回空对象', () => {
      expect(StyleHandler.cssStyleValueToObject(123 as any)).toEqual({})
      expect(StyleHandler.cssStyleValueToObject(true as any)).toEqual({})
      expect(StyleHandler.cssStyleValueToObject(null as any)).toEqual({})
    })

    it('应该处理空字符串', () => {
      expect(StyleHandler.cssStyleValueToObject('')).toEqual({})
    })

    it('应该忽略格式错误的样式规则', () => {
      const result = StyleHandler.cssStyleValueToObject(
        'color: red; invalid; background-color: blue'
      )
      expect(result).toEqual({ color: 'red', backgroundColor: 'blue' })
    })

    it('应该使用toCamelCase处理属性名', () => {
      const result = StyleHandler.cssStyleValueToObject('font-size: 14px; background-color: blue')
      expect(result).toEqual({ fontSize: '14px', backgroundColor: 'blue' })
    })
  })

  describe('cssClassValueToArray', () => {
    it('应该将字符串分割为数组', () => {
      const result = StyleHandler.cssClassValueToArray('class1 class2  class3')
      expect(result).toEqual(['class1', 'class2', 'class3'])
    })

    it('应该原样返回数组', () => {
      const result = StyleHandler.cssClassValueToArray(['class1', 'class2'])
      expect(result).toEqual(['class1', 'class2'])
    })

    it('应该将对象转换为truthy键名数组', () => {
      const result = StyleHandler.cssClassValueToArray({
        class1: true,
        class2: false,
        class3: true
      })
      expect(result).toEqual(['class1', 'class3'])
    })

    it('对于其他类型应该返回空数组', () => {
      expect(StyleHandler.cssClassValueToArray(123 as any)).toEqual([])
      expect(StyleHandler.cssClassValueToArray(true as any)).toEqual([])
      expect(StyleHandler.cssClassValueToArray(null as any)).toEqual([])
    })
  })

  describe('cssClassValueToString', () => {
    it('应该去除字符串输入的首尾空格', () => {
      const result = StyleHandler.cssClassValueToString('  class1 class2  ')
      expect(result).toBe('class1 class2')
    })

    it('应该连接数组元素并过滤空值', () => {
      const result = StyleHandler.cssClassValueToString(['class1', ' ', 'class2', ''])
      expect(result).toBe('class1 class2')
    })

    it('应该连接对象的truthy键名', () => {
      const result = StyleHandler.cssClassValueToString({
        class1: true,
        class2: false,
        class3: true
      })
      expect(result).toBe('class1 class3')
    })

    it('对于其他类型应该返回空字符串', () => {
      expect(StyleHandler.cssClassValueToString(123 as any)).toBe('')
      expect(StyleHandler.cssClassValueToString(true as any)).toBe('')
      expect(StyleHandler.cssClassValueToString(null as any)).toBe('')
    })
  })
})
