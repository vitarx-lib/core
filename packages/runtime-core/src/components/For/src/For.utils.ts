import { isFunction, isObject, logger } from '@vitarx/utils'
import type { CodeLocation, View } from '../../../types/index.js'
import type { ListView } from '../../../view/implements/index.js'
import type { ListItemMap, ListKeyResolver, ListLifecycleHook } from './For.core.js'

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
 *
 * @example
 * ```typescript
 * ensureMounted(
 *   myView,
 *   myList,
 *   anchorView,
 *   (view) => console.log('View mounted:', view)
 * )
 * ```
 */
export function ensureMounted(
  view: View,
  listView: ListView,
  anchor: View | null,
  cb: ListLifecycleHook['onEnter']
): void {
  // 若目标 view 与当前 view 生命周期不一致，需初始化
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
  // 同步 active 状态
  if (listView.active !== view.active) {
    view[listView.active ? 'activate' : 'deactivate']()
  }
  cb?.(view)
}

/**
 * 将视图节点移动到指定位置
 *
 * @param renderer - 渲染器实例，用于执行DOM操作
 * @param listView - 列表视图实例，作为父容器
 * @param view - 需要移动的视图实例
 * @param anchor - 锚点视图实例，如果提供则插入到该节点之前，否则追加到父容器末尾
 */
export function moveDOM(renderer: any, listView: ListView, view: View, anchor: View | null): void {
  if (view.isMounted) {
    if (anchor) renderer.insert(view.node, anchor.node)
    else renderer.append(listView.node, view.node)
  }
}
/**
 * normalize key resolver
 */
export function normalizeKeyResolver<T>(
  key: ListKeyResolver<T> | undefined,
  location: CodeLocation | undefined,
  name: string
): (item: T, index: number) => unknown {
  if (!key) return () => Symbol()
  if (isFunction(key))
    return (item, index) => {
      try {
        return key(item)
      } catch (e) {
        if (__DEV__) {
          logger.warn(`[${name}] key function throw error in ${index}: ${e}`, location)
        }
        return Symbol()
      }
    }
  return (item, index) => {
    if (!isObject(item)) return Symbol()
    if (key in item) {
      return item[key]
    } else {
      logger.warn(`[${name}] key '${String(key)}' not found in each["${index}"]`, location)
      return Symbol()
    }
  }
}

/**
 * 检查列表项的 key 是否重复，并在开发环境下提供详细的警告信息
 *
 * @param key - 待检查的 key 值，可以是任意类型
 * @param index - 当前 key 所在的索引位置
 * @param map - 已存在的 key 映射表，用于检测重复
 * @param name - 组件或列表的名称，用于错误信息提示
 * @returns 如果 key 重复则返回包含重复标记的对象，否则返回原始 key
 *
 * @description
 * 该函数用于检测列表渲染时的 key 重复问题：
 * - 当检测到重复 key 时，在开发环境下会输出详细的警告信息，包括：
 *   - 重复的 key 值
 *   - 之前使用该 key 的索引位置
 *   - 当前索引位置
 *   - 可能导致的问题说明
 *   - 正确的 key 使用示例
 * - 返回值说明：
 *   - 重复时：返回 Symbol
 *   - 不重复时：返回原始 key
 */
export function checkKey(key: unknown, index: number, map: ListItemMap, name: string): unknown {
  if (map.has(key)) {
    if (__DEV__) {
      const existingRecord = map.get(key)!
      const errorMsg =
        `[${name}] Duplicate key "${String(key)}" detected\n` +
        `  Key "${String(key)}" was already used at index ${existingRecord.indexRef.value}, now encountered at index ${index}.\n` +
        `  This can cause rendering issues and unexpected behavior.\n` +
        `  Please ensure your key function returns unique values for each item.\n` +
        `  Example: key={(item, index) => item.id}`
      logger.warn(errorMsg, location)
    }
    return Symbol()
  }
  return key
}
