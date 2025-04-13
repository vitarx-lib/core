import { toRaw } from '@vitarx/responsive'
import { isRecordObject, isString } from '@vitarx/utils'
import type { ClassProperties, EventOptions, StyleProperties, StyleRules } from './types/index'

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_match, group1) => group1.toUpperCase())
}

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
}

/**
 * 将style字符串转换为style对象
 *
 * 如果是对象，则会直接返回
 *
 * @param {StyleProperties} style - style字符串
 * @returns {StyleRules}  转换后的style对象
 */
export function cssStyleValueToObject(style: StyleProperties): StyleRules {
  if (isString(style)) {
    const styleObj: Record<string, any> = {}
    style.split(';').forEach(styleRule => {
      const [key, value] = styleRule.split(':').map(s => s.trim())
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
 * 将style对象转换为字符串
 *
 * @param {StyleRules} styleObj - style对象
 * @returns {string} 转换后的style字符串
 */
export function cssStyleValueToString(styleObj: StyleProperties): string {
  if (!styleObj) return ''
  if (isString(styleObj)) return styleObj
  if (!isRecordObject(styleObj)) return ''
  const styles: Array<string> = []
  Object.keys(styleObj).forEach(key => {
    const value = toRaw(styleObj[key as any]!)
    const type = typeof value
    const isValid = type === 'number' || type === 'string'
    if (isValid) {
      styles.push(`${toKebabCase(key)}: ${value}`)
    }
  })
  return styles.join('; ')
}

/**
 * 合并两个style
 *
 * @param {StyleProperties} style1
 * @param {StyleProperties} style2
 * @returns {StyleRules} 合并后的style对象
 */
export function mergeCssStyle(style1: StyleProperties, style2: StyleProperties): StyleRules {
  // 如果style1是字符串，先转换为对象
  const obj1 = cssStyleValueToObject(style1)
  // 如果style2是字符串，先转换为对象
  const obj2 = cssStyleValueToObject(style2)

  // 合并对象，后者覆盖前者
  return { ...obj1, ...obj2 }
}

/**
 * 将 class 属性转换为数组
 *
 * @param {ClassProperties} classInput - 可以是 string, string[] 或对象类型
 * @returns {string[]} 返回一个数组，数组元素为类名
 */
export function cssClassValueToArray(classInput: ClassProperties): string[] {
  if (typeof classInput === 'string') {
    return classInput.split(' ').filter(Boolean)
  }

  if (Array.isArray(classInput)) {
    return classInput
  }

  if (typeof classInput === 'object') {
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
export function cssClassValueToString(classInput: ClassProperties): string {
  if (typeof classInput === 'string') {
    return classInput.trim()
  }
  if (Array.isArray(classInput)) {
    return classInput
      .map(item => item.trim())
      .filter(Boolean)
      .join(' ')
  }
  if (typeof classInput === 'object' && classInput !== null) {
    // 如果是对象类型，返回键名数组
    return Object.keys(classInput)
      .filter(key => classInput[key])
      .join(' ')
  }
  return ''
}

/**
 * 合并两个class
 *
 * 返回值类型和第一个参数类型一致
 *
 * @param {ClassProperties} c1 - class1
 * @param {ClassProperties} c2 - class2
 * @returns {string[]} 合并后的数组，数组元素为类名
 */
export function mergeCssClass(c1: ClassProperties, c2: ClassProperties): string[] {
  // 将 c1 和 c2 转换为数组
  const arr1 = cssClassValueToArray(c1)
  const arr2 = cssClassValueToArray(c2)

  // 合并并去重
  return Array.from(new Set([...arr1, ...arr2]))
}

/**
 * 提取事件选项
 *
 * @internal 用于绑定事件时提取事件选项
 * @param {string} name 事件名称
 * @returns {object} 包含事件名和选项的对象
 * @example
 * extractEventOptions('onclick') // { event: 'click', options: {} }
 * extractEventOptions('onClickCapture') // { event: 'click', options: { capture: true } }
 */
export function extractEventOptions(name: string): { event: string; options: EventOptions } {
  const options = {} as EventOptions
  let event = name.toLowerCase()
  if (event.startsWith('on')) event = event.slice(2)
  if (event.endsWith('capture')) {
    event = event.slice(0, -7)
    options.capture = true
  }
  if (event.endsWith('once')) {
    event = event.slice(0, -5)
    options.once = true
  }
  if (event.endsWith('passive')) {
    event = event.slice(0, -7)
    options.passive = true
  }
  return { event, options }
}
