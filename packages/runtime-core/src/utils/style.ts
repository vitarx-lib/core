import { toRaw } from '@vitarx/responsive'
import { isRecordObject, isString, toCamelCase, toKebabCase } from '@vitarx/utils'
import type { ClassProperties, StyleProperties, StyleRules } from '../types/index.js'

/**
 * StyleUtils 类是一个用于处理 CSS 类和样式对象的工具类。
 * 提供了合并、转换 CSS 类和样式的方法，支持多种输入格式（字符串、数组、对象）之间的互相转换。
 *
 * 核心功能包括：
 * - 合并 CSS 类名（mergeCssClass）
 * - 合并 CSS 样式（mergeCssStyle）
 * - CSS 样式对象与字符串的互相转换（cssStyleValueToString, cssStyleValueToObject）
 * - CSS 类名与数组、字符串的互相转换（cssClassValueToArray, cssClassValueToString）
 *
 * 示例用法：
 * ```typescript
 * // 合并类名
 * const mergedClasses = StyleUtils.mergeCssClass('class1 class2', { class2: true, class3: true });
 * // 合并样式
 * const mergedStyles = StyleUtils.mergeCssStyle('color: red;', { fontSize: '14px' });
 * // 转换类名为数组
 * const classArray = StyleUtils.cssClassValueToArray('class1 class2');
 * // 转换样式对象为字符串
 * const styleString = StyleUtils.cssStyleValueToString({ color: 'red', fontSize: '14px' });
 * ```
 *
 * 注意事项：
 * - 所有方法都是静态方法，可以直接通过类名调用
 * - 样式属性的命名会自动在驼峰命名和 kebab-case 之间转换
 * - 空值和无效值会被自动过滤
 */
export class StyleUtils {
  /**
   * 合并两个class
   *
   * @param {ClassProperties} c1 - class1
   * @param {ClassProperties} c2 - class2
   * @returns {string[]} 合并后的数组，数组元素为类名
   */
  static mergeCssClass(c1: ClassProperties, c2: ClassProperties): string[] {
    // 将 c1 和 c2 转换为数组
    const arr1 = this.cssClassValueToArray(c1)
    const arr2 = this.cssClassValueToArray(c2)

    // 合并并去重
    return Array.from(new Set([...arr1, ...arr2]))
  }

  /**
   * 合并两个style
   *
   * @param {StyleProperties} style1 - 第一个样式对象或字符串
   * @param {StyleProperties} style2 - 第二个样式对象或字符串
   * @returns {StyleRules} 合并后的style对象
   */
  static mergeCssStyle(style1: StyleProperties, style2: StyleProperties): StyleRules {
    // 如果style1是字符串，先转换为对象
    const obj1 = this.cssStyleValueToObject(style1)
    // 如果style2是字符串，先转换为对象
    const obj2 = this.cssStyleValueToObject(style2)

    // 合并对象，后者覆盖前者
    return { ...obj1, ...obj2 }
  }

  /**
   * 将style对象转换为字符串
   *
   * @param {StyleProperties} styleObj - style对象
   * @returns {string} 转换后的style字符串
   */
  static cssStyleValueToString(styleObj: StyleProperties): string {
    if (!styleObj) return ''
    if (typeof styleObj === 'string') return styleObj
    if (!isRecordObject(styleObj)) return ''
    const styles: Array<string> = []
    Object.keys(styleObj).forEach(key => {
      const value = toRaw(styleObj[key as any]!)
      const type = typeof value
      const isValid = type === 'number' || type === 'string'
      if (isValid && (value || value === 0)) {
        styles.push(`${toKebabCase(key)}: ${value}`)
      }
    })
    return styles.length > 0 ? styles.join('; ') + ';' : ''
  }

  /**
   * 将style字符串转换为style对象
   *
   * 如果是对象，则会直接返回
   *
   * @param {StyleProperties} style - style字符串
   * @returns {StyleRules}  转换后的style对象
   */
  static cssStyleValueToObject(style: StyleProperties): StyleRules {
    if (isString(style)) {
      const styleObj: Record<string, any> = {}
      style.split(';').forEach(styleRule => {
        const [key, value] = styleRule.split(':').map(s => s?.trim())
        if (key && value) {
          styleObj[toCamelCase(key)] = value // 转为驼峰命名
        }
      })
      return styleObj as StyleRules
    } else if (isRecordObject(style)) {
      return style
    }
    return {}
  }

  /**
   * 将 class 属性转换为数组
   *
   * @param {ClassProperties} classInput - 可以是 string, string[] 或对象类型
   * @returns {string[]} 返回一个数组，数组元素为类名
   */
  static cssClassValueToArray(classInput: ClassProperties): string[] {
    if (typeof classInput === 'string') {
      return classInput.split(' ').filter(Boolean)
    }

    if (Array.isArray(classInput)) {
      const classArray: string[] = []
      for (let i = 0; i < classInput.length; i++) {
        const item = toRaw(classInput[i])
        if (typeof item === 'string') {
          const text = item.trim()
          if (text) classArray.push(text)
        }
      }
      return classArray
    }

    if (typeof classInput === 'object' && classInput !== null) {
      // 如果是对象类型，返回键名数组
      return Object.keys(classInput).filter(key => classInput[key])
    }

    return []
  }

  /**
   * 将 class 属性转换为字符串
   *
   * @param {ClassProperties} classInput - 可以是 string, string[] 或对象类型
   * @returns {string} 返回一个字符串，字符串元素为类名
   */
  static cssClassValueToString(classInput: ClassProperties): string {
    if (typeof classInput === 'string') {
      return classInput.trim()
    }
    if (Array.isArray(classInput)) {
      let classText = ''
      for (let i = 0; i < classInput.length; i++) {
        const item = toRaw(classInput[i])
        if (typeof item === 'string') {
          const text = item.trim()
          if (text) classText += item.trim() + ' '
        }
      }
      return classText.trim()
    }
    if (typeof classInput === 'object' && classInput !== null) {
      // 如果是对象类型，返回键名数组
      return Object.keys(classInput)
        .filter(key => classInput[key])
        .join(' ')
    }
    return ''
  }
}
