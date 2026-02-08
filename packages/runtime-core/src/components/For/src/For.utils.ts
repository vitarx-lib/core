import type { View } from '../../../types/index.js'
import { ListView } from '../../../view/index.js'
import type { ListLifecycleHook } from './For.core.js'

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

/* -------------------------------------------
 * View Helpers (Top-level)
 * ----------------------------------------- */

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
      cb?.(view)
    }
  }
  // 同步 active 状态
  if (listView.active !== view.active) {
    view[listView.active ? 'activate' : 'deactivate']()
  }
}

export function moveDOM(renderer: any, listView: ListView, view: View, anchor: View | null): void {
  if (view.isMounted) {
    if (anchor) renderer.insert(view.node, anchor.node)
    else renderer.append(listView.node, view.node)
  }
}

export function removeView(listView: ListView, view: View, cb: ListLifecycleHook['onLeave']) {
  listView.remove(view)

  if (cb) {
    cb(view, () => view.dispose())
  } else {
    view.dispose()
  }
}
