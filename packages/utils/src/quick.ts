import { isArray, isObject, isRecordObject } from './detect.js'

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

type DeepMergeObjectOptions = {
  /**
   * 是否允许将`undefined'值合并到目标对象中
   *
   * @default false
   */
  allowMergeUndefined?: boolean
  /**
   * 是否合并数组
   *
   * @default true
   */
  mergeArray?: boolean
}

/**
 * 深度合并两个对象
 *
 * 此函数通过递归地合并两个对象的属性，生成一个新的对象
 * 它处理嵌套的对象结构，并提供选项来控制是否允许合并undefined值以及是否合并数组
 *
 * @param {object} target 目标对象，将被源对象的属性合并
 * @param {object} source 源对象，其属性将合并到目标对象中
 * @param {object} [options] 可选配置对象，用于控制合并行为
 * @param {boolean} [options.allowMergeUndefined=false] - 是否允许将`undefined'值合并到目标对象中
 * @param {boolean} [options.mergeArray=true] - 是否合并数组
 * @returns 返回一个新的对象，包含目标对象和源对象合并后的属性
 *
 * 注意：如果目标和源对象的同一属性都是对象，它们将被递归合并
 * 如果它们的同一属性都是数组，并且配置允许合并数组，它们将被合并为一个新的数组
 * 如果源对象的属性是undefined，并且配置不允许合并undefined值，该属性将被忽略
 */
export function deepMergeObject<T extends Record<string, any>, U extends Record<string, any>>(
  target: T,
  source: U,
  options: DeepMergeObjectOptions = {}
): T & U {
  // 解构合并配置选项
  const { allowMergeUndefined = false, mergeArray = true } = options

  // 如果目标和源对象是相同地引用，直接返回
  if (Object.is(target, source)) return target as T & U

  // 确保目标和源都是记录对象（对象字面量或类实例）
  if (isRecordObject(target) && isRecordObject(source)) {
    // 初始化输出对象，以目标对象的属性开始
    const output: Record<string, any> = { ...target }

    // 创建一个包含目标和源对象所有键的集合
    const keys = new Set([...Object.keys(target), ...Object.keys(source)])

    // 遍历所有键
    for (const key of keys) {
      // 如果键存在于源对象中
      if (key in source) {
        const newValue = source[key]
        const oldValue = target[key]

        // 如果新旧值相同，跳过
        if (newValue === oldValue) continue

        // 如果新值是undefined，并且不允许合并undefined，则跳过该属性
        if (newValue === undefined && !allowMergeUndefined) {
          if (allowMergeUndefined) {
            output[key] = undefined
          } else {
            continue
          }
        }

        // 如果新旧值都是数组，并且配置允许合并数组，则合并
        if (isArray(newValue) && isArray(oldValue)) {
          output[key] = mergeArray ? [...oldValue, ...newValue] : newValue
          continue
        }

        // 如果新旧值都是对象，则递归合并
        if (isRecordObject(newValue) && isRecordObject(oldValue)) {
          output[key] = deepMergeObject(oldValue, newValue, options)
          continue
        }

        // 如果以上条件都不满足，直接覆盖旧值
        output[key] = newValue
      }
    }

    // 返回合并后的对象
    return output as T & U
  }

  // 如果目标或源对象不是记录对象，抛出类型错误
  throw new TypeError('deepMergeObject的参数1和2必须都是键值对对象类型')
}

/**
 * 防抖函数，使用setTimeout实现，在指定延迟后执行回调函数
 *
 * @param {function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {function} - 防抖后的函数
 */
export function debounce<T extends AnyCallback>(func: T, delay: number): FnCallback<Parameters<T>> {
  let timeout: ReturnType<typeof setTimeout>

  return function (...args: Parameters<T>) {
    // 清除上次的定时器
    clearTimeout(timeout)

    // 设置新的定时器，延迟调用
    timeout = setTimeout(() => {
      func(...args) // 执行回调
    }, delay)
  }
}

/**
 * 节流函数
 *
 * 和防抖函数不同，节流函数会根据时间间隔来执行回调函数，确保两次调用必须间隔一定时间。
 *
 * @param {function} callback - 要执行的函数
 * @param {number} delay - 间隔时间（毫秒）
 * @returns {function} - 节流后的函数
 */
export function throttle<T extends AnyCallback>(
  callback: T,
  delay: number
): FnCallback<Parameters<T>> {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) return
    setTimeout(() => {
      timeout = null
      callback(...args)
    }, delay)
  }
}

/**
 * 创建一个防抖函数，在一系列连续调用结束后仅执行一次回调函数。
 *
 * 回调函数将在微任务中执行，确保在所有调用完成后立即处理。
 *
 * @param {Function} callback - 回调函数，将在微任务中执行。
 * @param {Function} handleParams - 可选参数处理函数，用于自定义合并多次调用的参数。默认情况下，使用最后一次调用的参数。
 * @returns {Function} 返回一个防抖后的函数，该函数将在微任务中执行原始回调函数。
 *
 * 使用场景：
 * - 当需要确保一系列连续调用只触发一次回调时，例如批量处理多个请求或事件。
 * - 合并多次调用的参数，以减少不必要地重复操作。
 */
export function microTaskDebouncedCallback<
  T extends AnyCallback,
  Params extends any[] = Parameters<T>
>(
  callback: T,
  handleParams?: (last: Parameters<T>, prev: Params | null) => Params
): FnCallback<Parameters<T>> {
  let taskParams: Params | null = null

  return (...args: Parameters<T>) => {
    if (taskParams === null) {
      Promise.resolve().then(() => {
        const requestParams = taskParams!
        taskParams = null
        callback.apply(null, requestParams)
      })
    }
    taskParams = (
      typeof handleParams === 'function' ? handleParams(args, taskParams) : args
    ) as Params
  }
}
