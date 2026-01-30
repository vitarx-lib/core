import { logger } from '@vitarx/utils'
import { ListView } from '../../../core/index.js'
import { getRenderer } from '../../../runtime/index.js'
import type { CodeLocation, View } from '../../../types/index.js'

export type KeyedViewMap = Map<unknown, { view: View; index: number }>
export type ViewFactory<T> = (item: T, index: number) => View
export type KeyExtractor<T> = (item: T, index: number) => any
export interface MoveViewPlan {
  view: View
  type: 'mount' | 'move'
  anchor?: View | null
}
export interface ListDiffResult {
  plans: MoveViewPlan[]
  keyedMap: KeyedViewMap
  removedChildren: View[]
}

/**
 * 计算最长递增子序列 (Longest Increasing Subsequence, LIS)
 *
 * 使用优化的 O(n log n) 算法计算数组的最长递增子序列。
 * 这个算法在子节点更新中用于确定哪些节点不需要移动，
 从而最小化 DOM 操作，提高性能。
 *
 * 算法步骤：
 * 1. 遍历数组，构建递增序列
 * 2. 使用二分查找确定插入位置
 * 3. 记录前驱节点关系
 * 4. 回溯构建最终序列
 *
 * @param arr - 输入数组，包含 -1 表示无效位置
 * @returns {number[]} 最长递增子序列的索引数组
 */
export function getLIS(arr: number[]): number[] {
  // p 数组记录每个位置的前驱节点索引
  const p = arr.slice()
  // result 数组记录当前递增序列的末尾索引
  const result: number[] = []
  let u: number, v: number, c: number
  // 遍历输入数组
  for (let i = 0; i < arr.length; i++) {
    const arrI = arr[i]
    // 跳过无效位置
    if (arrI === -1) continue
    // 如果结果数组为空或当前元素大于结果数组末尾元素，直接追加
    if (result.length === 0 || arr[result[result.length - 1]] < arrI) {
      p[i] = result.length > 0 ? result[result.length - 1] : -1
      result.push(i)
      continue
    }
    // 使用二分查找确定插入位置
    u = 0
    v = result.length - 1
    while (u < v) {
      c = ((u + v) / 2) | 0 // 向下取整
      if (arr[result[c]] < arrI) u = c + 1
      else v = c
    }
    // 如果当前元素可以替换结果数组中的某个元素
    if (arrI < arr[result[u]]) {
      if (u > 0) p[i] = result[u - 1]
      result[u] = i
    }
  }
  // 回溯构建最终序列
  u = result.length
  v = result[u - 1]
  const seq: number[] = new Array(u)
  while (u-- > 0) {
    seq[u] = v
    v = p[v]
  }
  return seq
}

/**
 * 计算最小移动计划，确定视图的最优移动策略
 *
 * @param newChildren - 新的子视图数组
 * @param sourceIndex - 源索引数组，表示每个子视图在旧数组中的位置
 * @returns {MoveViewPlan[]} 返回移动计划数组，包含每个视图的移动类型和锚点视图
 */
function planMinimalMove(newChildren: View[], sourceIndex: number[]): MoveViewPlan[] {
  const plans: MoveViewPlan[] = [] // 存储最终的移动计划
  const lis = getLIS(sourceIndex) // 获取最长递增子序列(LIS)
  let lisIndex = lis.length - 1 // LIS数组的索引，从末尾开始
  let anchor: View | null = null // 锚点视图，用于确定插入位置

  // 从后向前遍历新子视图数组
  for (let i = newChildren.length - 1; i >= 0; i--) {
    const view = newChildren[i] // 当前处理的视图
    const oldIndex = sourceIndex[i] // 视图在旧数组中的索引

    // 如果视图存在于旧数组中，且当前索引在LIS中，则不需要移动
    if (oldIndex !== -1 && lisIndex >= 0 && lis[lisIndex] === i) {
      // LIS 中 → 不移动
      lisIndex--
      anchor = view
      continue
    }

    plans.push({ view, type: oldIndex === -1 ? 'mount' : 'move', anchor })
    anchor = view
  }

  return plans
}

/**
 * 构建差异比较结果
 *
 * 用于高效地比较新旧两组子元素，并确定需要添加、保留或移除的视图。
 *
 * @param oldKeyedMap 旧元素的键值映射表，包含键与视图的对应关系
 * @param each 新元素的数组
 * @param build 用于创建新视图的工厂函数
 * @param getKey 用于从元素中提取键的函数
 * @param location 可选的代码位置信息，用于错误报告
 * @returns {ListDiffResult} 返回一个包含差异比较结果的对象
 */
export function buildListDiff<T>(
  oldKeyedMap: KeyedViewMap,
  each: readonly T[],
  build: ViewFactory<T>,
  getKey: KeyExtractor<T>,
  location?: CodeLocation
): ListDiffResult {
  // 返回差异比较结果
  const newChildren: View[] = [] // 存储新创建的视图
  const keyedMap: KeyedViewMap = new Map() // 新元素的键值映射表
  const sourceIndex: number[] = new Array(each.length).fill(-1) // 记录新元素在旧数组中的索引位置

  // 遍历新元素数组
  for (let i = 0; i < each.length; i++) {
    let key = getKey(each[i], i) // 获取当前元素的键
    const cached = oldKeyedMap.get(key) // 从旧映射表中查找相同键的元素
    let view: View

    // 如果在旧映射表中找到相同键的元素
    if (cached) {
      sourceIndex[i] = cached.index // 记录该元素在旧数组中的索引
      view = cached.view // 复用已存在的视图
    } else {
      view = build(each[i], i) // 否则创建新视图
    }

    // 检查键是否重复
    if (keyedMap.has(key)) {
      logger.warn(`Duplicate key "${String(key)}" index "${i}" found`, location) // 记录警告信息
      key = Symbol() // 使用Symbol作为唯一键
    }

    keyedMap.set(key, { view, index: i }) // 将键和视图信息存入新映射表
    newChildren.push(view) // 将视图添加到新视图数组中
  }

  const removedChildren: View[] = [] // 存储需要移除的视图
  // 遍历旧映射表，找出在新映射表中不存在的键（即需要移除的元素）
  for (const [key, { view }] of oldKeyedMap) {
    if (!keyedMap.has(key)) removedChildren.push(view) // 将需要移除的视图添加到数组中
  }
  const plans = planMinimalMove(newChildren, sourceIndex) // 计算最小移动计划
  return { plans, keyedMap, removedChildren } // 返回差异比较结果
}

/**
 * 初始化子元素函数
 *
 * @param listView - 列表视图对象，用于管理子元素的显示
 * @param oldKeyedMap - 已存在的键值映射表，用于跟踪已添加的子元素
 * @param each - 只读数组，包含需要初始化的子元素数据
 * @param build - 子元素工厂函数，用于根据数据创建视图
 * @param getKey - 键生成函数，用于为每个子元素生成唯一键
 * @param [location] - 可选参数，代码位置信息，用于错误报告
 * @returns {KeyedViewMap} 更新后的键值映射表
 */
export function initListChildren<T>(
  listView: ListView,
  oldKeyedMap: KeyedViewMap,
  each: readonly T[],
  build: ViewFactory<T>,
  getKey: KeyExtractor<T>,
  location?: CodeLocation
): KeyedViewMap {
  // 返回更新后的键值映射表
  const length = each.length
  for (let index = 0; index < length; index++) {
    // 遍历数组
    const item = each[index] // 获取当前元素
    let key = getKey(item, index) // 为元素生成键
    const view = build(item, index) // 创建元素视图
    if (oldKeyedMap.has(key)) {
      // 检查键是否已存在
      logger.warn(`Duplicate key "${key}" index "${index}" found in For component`, location) // 重复键警告
      key = Symbol()
    }
    oldKeyedMap.set(key, { view, index })
    listView.append(view)
  }
  return oldKeyedMap // 返回更新后的映射表
}

/**
 * 更新列表子元素的函数
 *
 * @param listView - 列表视图实例，用于管理视图的插入、移动和删除
 * @param oldKeyedMap - 旧的键值映射表，记录之前列表的视图映射关系
 * @param each - 当前要渲染的数据数组
 * @param build - 视图工厂函数，用于根据数据创建视图
 * @param getKey - 键提取函数，用于从数据中获取唯一标识
 * @param [location] - 可选的代码位置信息，用于调试
 * @returns {KeyedViewMap} 返回更新后的键值映射表
 */
export function updateListChildren<T>(
  listView: ListView,
  oldKeyedMap: KeyedViewMap,
  each: readonly T[],
  build: ViewFactory<T>,
  getKey: KeyExtractor<T>,
  location?: CodeLocation
): KeyedViewMap {
  // 构建列表差异计划，包括需要移动、挂载和卸载的视图
  const { plans, keyedMap, removedChildren } = buildListDiff(
    oldKeyedMap,
    each,
    build,
    getKey,
    location
  )
  const renderer = getRenderer()
  // 执行所有计划中的操作
  for (const plan of plans) {
    const { view, type, anchor } = plan

    // 先操作链表，再操作 DOM
    // 如果有锚点，则插入到锚点前，否则追加到末尾
    if (type === 'move') {
      if (anchor) listView.insert(view, anchor)
      else listView.append(view)
      // 如果锚点已激活，则在 DOM 中插入对应的节点

      if (anchor?.isActivated) renderer.insert(view.node, anchor.node)
      // 如果有锚点，则插入到锚点前，否则追加到末尾
    } else if (type === 'mount') {
      if (anchor) listView.insert(view, anchor)
      else listView.append(view)
      // 如果视图未被标记为未使用，则初始化视图

      if (!listView.isUnused) {
        // 如果列表已激活，则挂载视图到 DOM
        view.init(listView.ctx)
        if (listView.isActivated) {
          if (anchor) view.mount(anchor.node, 'insert')
          else view.mount(listView.node, 'append')
        }
      }
    }
  }
  // 清理旧节点
  for (const view of removedChildren) {
    listView.remove(view)
    view.dispose()
  }

  return keyedMap
}
