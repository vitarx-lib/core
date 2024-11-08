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
 */
export function sleep(time: number) {
  return new Promise(resolve => setTimeout(resolve, time))
}
