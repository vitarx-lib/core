import { isRecordObject, isString } from './detect.js'
import type {
  CssPropertiesMap,
  HTMLClassProperties,
  HTMLStyleProperties
} from '../core/renderer/web-runtime-dom/index.js'

// 辅助函数：将中划线命名转换为驼峰命名
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_match, group1) => group1.toUpperCase())
}

// 辅助函数：将驼峰命名转换为中划线命名
function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
}

/**
 * 将style字符串转换为style对象
 *
 * 如果是对象，则会直接返回
 *
 * @param {HTMLStyleProperties} style - style字符串
 * @returns {CssPropertiesMap}  转换后的style对象
 */
export function cssStyleToObject(style: HTMLStyleProperties): CssPropertiesMap {
  if (isString(style)) {
    const styleObj: Record<string, any> = {}
    style.split(';').forEach(styleRule => {
      const [key, value] = styleRule.split(':').map(s => s.trim())
      if (key && value) {
        styleObj[toCamelCase(key)] = value // 转为驼峰命名
      }
    })
    return styleObj as CssPropertiesMap
  } else if (isRecordObject(style)) {
    return style
  }
  return {}
}

/**
 * 将style对象转换为字符串
 *
 * @param {CssPropertiesMap} styleObj - style对象
 */
export function cssStyleObjectToString(styleObj: CssPropertiesMap): string {
  return Object.entries(styleObj)
    .map(([key, value]) => `${toKebabCase(key)}: ${value}`) // 驼峰转为中划线
    .join('; ')
}

/**
 * 合并两个style
 *
 * @param {HTMLStyleProperties} style1
 * @param {HTMLStyleProperties} style2
 * @returns {CssPropertiesMap} 合并后的style对象
 */
export function mergeCssStyle(
  style1: HTMLStyleProperties,
  style2: HTMLStyleProperties
): CssPropertiesMap {
  // 如果style1是字符串，先转换为对象
  const obj1 = cssStyleToObject(style1)
  // 如果style2是字符串，先转换为对象
  const obj2 = cssStyleToObject(style2)

  // 合并对象，后者覆盖前者
  return { ...obj1, ...obj2 }
}

/**
 * 将 class 属性转换为数组
 *
 * @param {HTMLClassProperties} classInput - 可以是 string, string[] 或对象类型
 * @returns {string[]} 返回一个数组，数组元素为类名
 */
function cssClassPropToArray(classInput: HTMLClassProperties): string[] {
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
 * 合并两个class
 *
 * 返回值类型和第一个参数类型一致
 *
 * @param {HTMLClassProperties} c1 - class1
 * @param {HTMLClassProperties} c2 - class2
 * @returns {string[]} 合并后的数组，数组元素为类名
 */
export function mergeCssClass(c1: HTMLClassProperties, c2: HTMLClassProperties): string[] {
  // 将 c1 和 c2 转换为数组
  const arr1 = cssClassPropToArray(c1)
  const arr2 = cssClassPropToArray(c2)

  // 合并并去重
  return Array.from(new Set([...arr1, ...arr2]))
}
