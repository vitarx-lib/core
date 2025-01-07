import { isObject } from './detect.js'

/**
 * 弹出对象属性。
 *
 * @param obj
 * @param key
 */
export function popProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  if (isObject(obj)) {
    if (key in obj) {
      const value = obj[key]
      delete obj[key] // 从对象中移除属性
      return value
    }
  }
  return undefined as T[K]
}

/**
 * 休眠一段时间。
 *
 * @example
 * await sleep(1000)
 *
 * @param time - 毫秒
 * @returns Promise
 */
export function sleep(time: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, time))
}

/**
 * 合并对象
 *
 * @param {object} target - 目标对象
 * @param {object} source - 源对象
 */
export function deepMergeObject(
  target: AnyRecord,
  source: AnyRecord
): AnyRecord {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        deepMergeObject(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }
  return target
}
