import { isFunction } from '@vitarx/utils'
import { logger } from '@vitarx/utils/src/index.js'
import { ViewKind } from '../../constants/index.js'
import { type ViewEffect, viewEffect } from '../../runtime/effect.js'
import { getRenderer } from '../../runtime/index.js'
import type {
  CodeLocation,
  HostContainer,
  HostNode,
  MountType,
  ResolvedChildren,
  View
} from '../../types/index.js'
import { BaseView } from './base.js'

type KeyedMap = Map<unknown, { view: View; index: number }>
export type BuildItemView<T> = (item: T, index: number) => View
export type MakeKey<T> = (item: T, index: number) => unknown
export interface ForProps<T = any> {
  /**
   * 需要渲染的数组
   */
  each: readonly T[]
  /**
   * 子视图渲染函数
   *
   * @param item - 当前项
   * @param index - 当前项的索引
   */
  children: BuildItemView<T>
  /**
   * key生成函数
   *
   * 支持数据类型的值做为 `key`，但要求不能重复！
   *
   * @param item - 当前项
   * @param index - 当前项的索引
   */
  key?: MakeKey<T>
}
const isValidKey = (key: unknown): boolean => {
  return key != null && typeof key !== 'boolean'
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
const getLIS = (arr: number[]): number[] => {
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
type BuildResult = {
  children: ResolvedChildren
  keyedMap: KeyedMap
  newIndexToOldIndex: number[]
  removedChildren: View[]
}
/**
 * 构建新的子节点列表
 *
 * @param newEach
 * @param oldChildren
 * @param oldKeyedMap
 * @param getKey
 * @param render
 * @param location
 */
const buildChildren = <T>(
  newEach: readonly T[],
  oldChildren: ResolvedChildren,
  oldKeyedMap: KeyedMap,
  getKey: MakeKey<T>,
  render: BuildItemView<T>,
  location?: CodeLocation
): BuildResult => {
  // 建立新子节点的 key 映射表
  const keyedMap: KeyedMap = new Map()
  // 新的遍历数据列表长度
  const newEachLength = newEach.length
  // 初始化新旧节点索引映射数组（-1 表示没有匹配）
  const newIndexToOldIndex = new Array(newEachLength).fill(-1)
  // 遍历新子节点列表
  const children: View[] = []
  // 复用的旧视图index索引
  const reuseIndex = new Set<number>()
  // 遍历新数据列表，生成新的视图。
  for (let i = 0; i < newEachLength; i++) {
    const newChild = newEach[i]
    const key = getKey(newChild, i)
    let view: View
    if (keyedMap.has(key)) {
      console.warn(`Duplicate key found: ${key}`, location)
      view = render(newChild, i)
    } else if (isValidKey(key)) {
      const cached = oldKeyedMap.get(key)
      if (cached) {
        view = cached.view
        reuseIndex.add(cached.index)
        // 记录旧视图位置
        newIndexToOldIndex[i] = cached.index
      } else {
        view = render(newChild, i)
      }
      keyedMap.set(key, { view, index: i })
    } else {
      view = render(newChild, i)
    }
    children.push(view)
  }
  // 旧视图列表长度
  const oldChildrenLength = oldChildren.length
  // 要被移除的视图列表
  const removedChildren: View[] = []
  for (let i = 0; i < oldChildrenLength; i++) {
    if (reuseIndex.has(i)) continue
    removedChildren.push(oldChildren[i])
  }
  return { keyedMap, children, newIndexToOldIndex, removedChildren }
}

/**
 * ForView 是一个用于渲染列表数据的视图组件，它继承自 BaseView，专门处理基于数组的动态列表渲染。
 *
 * 核心功能：
 * - 支持基于数组的动态列表渲染，能够高效地处理列表项的增删改查
 * - 提供基于 key 的列表项追踪机制，优化列表更新性能
 * - 支持响应式更新，当数据变化时自动重新渲染列表
 *
 * 代码示例：
 * ```typescript
 * const listView = new ForView({
 *   each: [1, 2, 3],
 *   key: (item) => item,
 *   children: (item, index) => {
 *     return new TextView({ text: `Item ${item}` })
 *   }
 * })
 * listView.init(ctx)
 * listView.mount(container)
 * ```
 *
 * 构造函数参数：
 * - props: ForProps<T> - 列表视图的属性对象，包含：
 *   - each: readonly T[] - 要渲染的数据数组
 *   - key?: (item: T, index: number) => Key - 可选的 key 生成函数，用于追踪列表项
 *   - children: (item: T, index: number) => View - 渲染每个列表项的函数
 * - location?: CodeLocation - 可选的代码位置信息，用于错误报告
 *
 * 使用限制：
 * - children 属性必须是一个函数，否则会抛出错误
 * - 如果提供了 key 函数，返回的 key 必须是唯一的，否则会发出警告
 * - 组件内部使用了 LRU 缓存机制，大量数据时可能会有性能影响
 *
 * 副作用：
 * - 组件会在初始化时创建 DOM 片段节点
 * - 组件会自动管理子视图的生命周期，包括初始化、挂载、激活和销毁
 */
export class ForView<T = unknown> extends BaseView<ViewKind.FOR> {
  public $node: HostNode | null = null
  public readonly kind: ViewKind.FOR = ViewKind.FOR

  private readonly getKey: MakeKey<T>
  private effect: ViewEffect | null = null

  constructor(
    public readonly props: ForProps<T>,
    location?: CodeLocation
  ) {
    super(location)
    if (!isFunction(props.children)) {
      throw new Error('ListView children must be a function')
    }
    this.getKey = isFunction(props.key) ? props.key : () => null
  }

  private _children: ResolvedChildren = []

  public get children(): ResolvedChildren {
    return this._children
  }

  protected override doInit(): void {
    let oldKeyedMap!: KeyedMap
    let isInit = false
    this.effect = viewEffect(() => {
      const newEach = this.props.each
      const render = this.props.children
      if (isInit) {
        oldKeyedMap = new Map()
        const children = this.initChildren(newEach, render, oldKeyedMap)
        this.replaceChildren(children)
        isInit = true
        return
      }
      const oldChildren = this.children
      const { children, keyedMap, newIndexToOldIndex, removedChildren } = buildChildren(
        newEach,
        oldChildren,
        oldKeyedMap,
        this.getKey,
        render,
        this.location
      )
      oldKeyedMap = keyedMap
      const newChildrenLength = children.length
      const seq = getLIS(newIndexToOldIndex)
      let seqIndex = seq.length - 1
      const renderer = getRenderer()
      for (let i = 0; i < newChildrenLength; i++) {
        const oldIndex = newIndexToOldIndex[i]
        const newChild = children[i]

        if (oldIndex !== -1) {
          // 移动节点，如果不在 LIS
          if (seqIndex >= 0 && seq[seqIndex] === i) {
            seqIndex--
          } else {
            const nextNode = children[i + 1]
            const anchor = nextNode?.$node
            if (anchor) renderer.insert(newChild.$node!, anchor)
            else renderer.append(this.$node!, newChild.$node!)
          }
          continue
        }
        // 挂载新节点
        if (this.isInitialized) {
          newChild.init(this.ctx)
        } else if (this.isActivated) {
          newChild.init(this.ctx)
          newChild.mount(this.$node!)
        }
      }
      // 卸载没有被使用的视图
      for (const removedChild of removedChildren) removedChild.dispose()
      // 绕过类型校验，直接将心的children替换进视图，内置组件唯一处需要绕过类型校验的地方！
      this.replaceChildren(children)
    })
  }

  protected override doMount(containerOrAnchor: HostContainer | HostNode, type: MountType): void {
    const renderer = getRenderer()
    if (!this.$node) {
      // 判断是否为svg命名空间
      this.$node = renderer.createFragment(this)
    }
    renderer[type](this.$node, containerOrAnchor)
    for (const child of this.children) child.mount(this.$node, 'append')
  }

  protected override doActivate() {
    this.effect?.resume()
  }

  protected override doDeactivate() {
    this.effect?.pause()
  }

  protected override doDispose() {
    for (const child of this.children) child.dispose()
    this._children = []
    this.effect?.()
  }

  private replaceChildren(newChildren: ResolvedChildren) {
    this._children = __DEV__ ? Object.freeze(newChildren) : newChildren
  }

  private initChildren(
    each: readonly T[],
    render: BuildItemView<T>,
    keyedMap: KeyedMap
  ): ResolvedChildren {
    return each.map((item, index) => {
      const key = this.getKey(item, index)
      const view = render(item, index)
      if (isValidKey(key)) {
        if (keyedMap.has(key)) {
          logger.warn(`Duplicate key "${key}" found in For component`, this.location)
        } else {
          keyedMap.set(key, { view, index })
        }
      }
      view.init(this.ctx)
      return view
    })
  }
}
