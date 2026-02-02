import { StyleUtils } from '../../../src/index.js'

describe('Runtime Core Shared Utils - StyleUtils', () => {
  describe('mergeCssClass', () => {
    it('应该合并两个字符串类名', () => {
      const result = StyleUtils.mergeCssClass('class1 class2', 'class2 class3')
      expect(result).toEqual(['class1', 'class2', 'class3'])
    })

    it('应该合并字符串和数组类名', () => {
      const result = StyleUtils.mergeCssClass('class1', ['class2', 'class3'])
      expect(result).toEqual(['class1', 'class2', 'class3'])
    })

    it('应该合并对象和字符串类名', () => {
      const result = StyleUtils.mergeCssClass({ class1: true, class2: false }, 'class2 class3')
      expect(result).toEqual(['class1', 'class2', 'class3'])
    })

    it('应该去重类名', () => {
      const result = StyleUtils.mergeCssClass('class1 class1', 'class1')
      expect(result).toEqual(['class1'])
    })
  })

  describe('mergeCssStyle', () => {
    it('应该合并两个样式字符串', () => {
      const result = StyleUtils.mergeCssStyle(
        'color: red; font-size: 14px;',
        'color: blue; margin: 10px;'
      )
      expect(result).toEqual({
        color: 'blue',
        fontSize: '14px',
        margin: '10px'
      })
    })

    it('应该合并字符串和对象样式', () => {
      const result = StyleUtils.mergeCssStyle('color: red;', { fontSize: '14px', margin: '10px' })
      expect(result).toEqual({
        color: 'red',
        fontSize: '14px',
        margin: '10px'
      })
    })

    it('应该合并两个样式对象', () => {
      const result = StyleUtils.mergeCssStyle({ color: 'red' }, { fontSize: '14px' })
      expect(result).toEqual({
        color: 'red',
        fontSize: '14px'
      })
    })
  })

  describe('cssStyleValueToString', () => {
    it('应该将样式对象转换为字符串', () => {
      const result = StyleUtils.cssStyleValueToString({ color: 'red', fontSize: '14px' })
      expect(result).toBe('color: red; font-size: 14px;')
    })

    it('应该返回空字符串对于空值', () => {
      expect(StyleUtils.cssStyleValueToString(null as any)).toBe('')
      expect(StyleUtils.cssStyleValueToString(undefined as any)).toBe('')
      expect(StyleUtils.cssStyleValueToString({})).toBe('')
    })

    it('应该直接返回字符串输入', () => {
      const styleString = 'color: red; font-size: 14px;'
      expect(StyleUtils.cssStyleValueToString(styleString)).toBe(styleString)
    })
  })

  describe('cssStyleValueToObject', () => {
    it('应该将样式字符串转换为对象', () => {
      const result = StyleUtils.cssStyleValueToObject('color: red; font-size: 14px;')
      expect(result).toEqual({
        color: 'red',
        fontSize: '14px'
      })
    })

    it('应该直接返回对象输入', () => {
      const styleObj = { color: 'red', fontSize: '14px' }
      expect(StyleUtils.cssStyleValueToObject(styleObj)).toBe(styleObj)
    })

    it('应该返回空对象对于空值', () => {
      expect(StyleUtils.cssStyleValueToObject(null as any)).toEqual({})
      expect(StyleUtils.cssStyleValueToObject(undefined as any)).toEqual({})
    })
  })

  describe('cssClassValueToArray', () => {
    it('应该将字符串类名转换为数组', () => {
      const result = StyleUtils.cssClassValueToArray('class1 class2 class3')
      expect(result).toEqual(['class1', 'class2', 'class3'])
    })

    it('应该直接返回数组输入', () => {
      const classArray = ['class1', 'class2']
      expect(StyleUtils.cssClassValueToArray(classArray)).toEqual(classArray)
    })

    it('应该将对象类名转换为数组', () => {
      const result = StyleUtils.cssClassValueToArray({ class1: true, class2: false, class3: true })
      expect(result).toEqual(['class1', 'class3'])
    })

    it('应该返回空数组对于空值', () => {
      expect(StyleUtils.cssClassValueToArray(null as any)).toEqual([])
      expect(StyleUtils.cssClassValueToArray(undefined as any)).toEqual([])
      expect(StyleUtils.cssClassValueToArray('')).toEqual([])
    })
  })

  describe('cssClassValueToString', () => {
    it('应该将字符串类名转换为字符串', () => {
      const result = StyleUtils.cssClassValueToString('class1 class2')
      expect(result).toBe('class1 class2')
    })

    it('应该将数组类名转换为字符串', () => {
      const result = StyleUtils.cssClassValueToString(['class1', 'class2', 'class3'])
      expect(result).toBe('class1 class2 class3')
    })

    it('应该将对象类名转换为字符串', () => {
      const result = StyleUtils.cssClassValueToString({ class1: true, class2: false, class3: true })
      expect(result).toBe('class1 class3')
    })

    it('应该返回空字符串对于空值', () => {
      expect(StyleUtils.cssClassValueToString(null as any)).toBe('')
      expect(StyleUtils.cssClassValueToString(undefined as any)).toBe('')
      expect(StyleUtils.cssClassValueToString([])).toBe('')
    })
  })
})
