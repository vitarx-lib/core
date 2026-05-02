import { isFunction, isObject, logger } from '@vitarx/utils'
import type { CodeLocation, View } from '../../../types/index.js'
import type { ListView } from '../../../view/index.js'
import type { ListKeyResolver, ListLifecycleHook } from './For.core.js'

/**
 * 获取给定数组的最长递增子序列（Longest Increasing Subsequence, LIS）
 *
 * @param arr - 输入的数字数组，其中-1表示需要跳过的元素
 * @returns {number[]} 返回最长递增子序列的索引数组
 *
 * @example
 * // 示例：输入 [3, 4, -1, 5, 1]
 * // 输出 [0, 1, 3]（对应值为 [3, 4, 5]）
 *
 * @remarks
 * 该算法使用动态规划和二分查找实现，时间复杂度为 O(n log n)
 * - 使用数组 p 记录每个元素的前驱索引
 * - 使用数组 result 维护当前最长递增子序列的索引
 * - 通过二分查找优化子序列的更新过程
 * - 最后通过前驱数组重构完整的 LIS
 */
export function getLIS(arr: number[]): number[] {
  const p = arr.slice()
  const result: number[] = []

  let u: number, v: number, c: number

  for (let i = 0; i < arr.length; i++) {
    const value = arr[i]
    if (value === -1) continue

    if (result.length === 0 || arr[result[result.length - 1]] < value) {
      p[i] = result.length > 0 ? result[result.length - 1] : -1
      result.push(i)
      continue
    }

    u = 0
    v = result.length - 1

    while (u < v) {
      c = ((u + v) / 2) | 0
      if (arr[result[c]] < value) u = c + 1
      else v = c
    }

    if (value < arr[result[u]]) {
      if (u > 0) p[i] = result[u - 1]
      result[u] = i
    }
  }

  u = result.length
  v = result[u - 1]

  const seq = new Array<number>(u)
  while (u-- > 0) {
    seq[u] = v
    v = p[v]
  }

  return seq
}

/**
 * 确保 View 组件已正确挂载到 DOM 中，并同步其生命周期状态
 *
 * @param view - 需要处理的视图组件
 * @param listView - 列表视图组件，提供挂载上下文和状态
 * @param anchor - 挂载锚点视图，用于确定插入位置
 * @param cb - 挂载完成后的回调函数
 * @returns void
 *
 * @remarks
 * 该函数主要执行以下操作：
 * 1. 检查并初始化视图组件（如果需要）
 * 2. 根据锚点位置将视图挂载到 DOM
 * 3. 同步视图的 active 状态
 * 4. 执行挂载完成回调
 */
export function ensureMounted(
  view: View,
  listView: ListView,
  anchor: View | null,
  cb: ListLifecycleHook['onEnter']
): void {
  if (view.state !== listView.state) {
    if (view.isDetached) view.init(listView.ctx)
    if (listView.isMounted) {
      if (anchor) {
        view.mount(anchor.node, 'insert')
      } else {
        view.mount(listView.node, 'append')
      }
    }
  }
  if (listView.isActive !== view.isActive) {
    view[listView.isActive ? 'activate' : 'deactivate']()
  }
  cb?.(view)
}

/**
 * 标准化 key 解析器
 *
 * 将用户提供的 key 配置统一转换为 (item, index) => unknown 函数。
 * 当未提供 key 时，默认使用 item 自身作为 key（值比较），
 * 确保相同值的列表项在更新时能被正确复用和移动。
 *
 * @param key - 用户提供的 key 配置（函数、属性名字符串或 undefined）
 * @param location - 代码位置信息，用于错误提示
 * @param name - 组件名称，用于错误提示
 * @returns 标准化的 key 解析函数，保证对同一 (item, index) 输入返回相同结果
 */
export function normalizeKeyResolver<T>(
  key: ListKeyResolver<T> | undefined,
  location: CodeLocation | undefined,
  name: string
): (item: T, index: number) => unknown {
  if (!key) return item => item
  if (isFunction(key))
    return (item, index) => {
      try {
        return key(item)
      } catch (e) {
        if (__VITARX_DEV__) {
          logger.warn(`[${name}] key function error at index ${index}`, e, location)
        }
        return Symbol()
      }
    }
  return (item, index) => {
    if (!isObject(item)) return Symbol()
    if (key in item) {
      return item[key]
    } else {
      logger.warn(`[${name}] key "${String(key)}" not found at index ${index}`, location)
      return Symbol()
    }
  }
}

/**
 * 检查列表项的 key 是否重复，并在开发环境下提供详细的警告信息
 *
 * @param key - 待检查的 key 值
 * @param index - 当前 key 所在的索引位置
 * @param usedKeys - 已使用的 key 到首次出现索引的映射表，用于检测重复
 * @param name - 组件名称，用于错误信息提示
 * @param location - 代码位置信息，用于错误提示
 * @returns 不重复时返回原始 key，重复时返回唯一 Symbol 并记录到 usedKeys
 */
export function checkKey(
  key: unknown,
  index: number,
  usedKeys: Map<unknown, number>,
  name: string,
  location: CodeLocation | undefined
): unknown {
  const firstIndex = usedKeys.get(key)
  if (firstIndex !== undefined) {
    if (__VITARX_DEV__) {
      const errorMsg =
        `[${name}] Duplicate key "${String(key)}" detected\n` +
        `  Key "${String(key)}" was already used at index ${firstIndex}, now encountered at index ${index}.\n` +
        `  This can cause rendering issues and unexpected behavior.\n` +
        `  Please ensure your key function returns unique values for each item.\n` +
        `  Example: key={item => item.id}`
      logger.warn(errorMsg, location)
    }
    key = Symbol()
  }
  usedKeys.set(key, index)
  return key
}
