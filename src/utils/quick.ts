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
   * 是否允许合并undefined
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
 * @param target 目标对象，将被源对象的属性合并
 * @param source 源对象，其属性将合并到目标对象中
 * @param options 可选配置对象，用于控制合并行为
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
  throw new TypeError('deepMergeObject函数的参数1-2必须是键值对对象')
}

/**
 * 防抖函数
 *
 * @param {function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {function} - 防抖后的函数
 */
export function debounce<T extends AnyCallback>(
  func: T,
  delay: number
): AnyFunction<Parameters<T>> {
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
 * @param {function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {function} - 节流后的函数
 */
export function throttle<T extends AnyCallback>(
  func: T,
  delay: number
): AnyFunction<Parameters<T>> {
  let lastExecTime = 0 // 上次执行的时间戳
  let timeoutId: ReturnType<typeof setTimeout> | null = null // 定时器 ID

  return (...args: Parameters<T>) => {
    const currentTime = Date.now() // 当前时间戳

    // 如果距离上次执行的时间小于 delay，则设置定时器
    if (currentTime - lastExecTime < delay) {
      if (timeoutId) {
        clearTimeout(timeoutId) // 清除之前的定时器
      }

      // 设置一个新的定时器，确保在 delay 时间后执行
      timeoutId = setTimeout(
        () => {
          lastExecTime = currentTime // 更新上次执行时间
          func(...args) // 执行函数
        },
        delay - (currentTime - lastExecTime)
      )
    } else {
      // 如果距离上次执行的时间大于等于 delay，则立即执行
      lastExecTime = currentTime // 更新上次执行时间
      func(...args) // 执行函数
    }
  }
}

/**
 * 创建一个防抖函数，用于在微任务中执行回调函数
 *
 * 防抖函数确保在一系列连续地调用结束后只执行一次回调函数，避免在每次调用时都执行回调
 *
 * @param {Function} callback 回调函数，将在微任务中执行
 * @returns {callback} 返回一个防抖后的函数，它将在微任务中执行原始回调函数
 */
export function debounceMicroTask<T extends AnyCallback>(callback: T): AnyFunction<Parameters<T>> {
  // 存储防抖函数的参数
  let taskParams: Parameters<T> | null = null

  // 返回一个匿名函数，它将根据情况调度或更新回调函数的执行
  return (...args: Parameters<T>) => {
    // 如果当前没有待处理的任务参数，则调度一个新的微任务来执行回调函数
    if (taskParams === null) {
      Promise.resolve().then(() => {
        // 在微任务中执行回调函数，并使用之前存储的参数
        const requestParams = taskParams!
        taskParams = null
        callback.apply(null, requestParams)
      })
    }
    // 更新当前的任务参数，确保在微任务中执行最新的参数
    taskParams = args
  }
}
