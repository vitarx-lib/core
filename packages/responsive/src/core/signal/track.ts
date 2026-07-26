import { type ExtraDebugData, type SignalOpType, triggerOnTrack } from './debug.js'
import { createDepLink, DepLink, destroyDepLink, type EffectRunner, type Signal } from './dep.js'
import { DEP_INDEX_MAP, DEP_VERSION, EFFECT_DEP_HEAD } from './symbol.js'

let currentActiveEffect: EffectRunner | null = null
let currentActiveSignal: Signal | null = null
let isPauseTracking: boolean = false
let isHasTracking: boolean = false

/**
 * 获取当前活动的副作用函数
 * 该函数用于获取当前正在执行的副作用函数，通常用于响应式系统中的依赖收集
 *
 * @returns 返回当前活动的副作用函数(DepEffectLike类型)，如果没有则返回null
 */
export function getActiveEffect(): EffectRunner | null {
  return currentActiveEffect // 返回当前活动的副作用函数
}

/**
 * 处理并清理依赖关系
 * 该函数用于遍历effect的所有依赖链接，移除过时的依赖关系，并清理不再需要的链接
 * @param effect - 需要处理的依赖效果对象，包含依赖关系和版本信息
 */
const finalizeDeps = (effect: EffectRunner): void => {
  // 从effect的依赖链头部开始遍历
  let link = effect[EFFECT_DEP_HEAD]
  while (link) {
    // 获取当前链接的下一个链接
    const next = link.eNext
    // 检查当前链接的版本是否与effect的版本不一致
    if (link[DEP_VERSION] !== effect[DEP_VERSION]) {
      // 如果存在索引映射，则从映射中删除对应的signal
      const index = effect[DEP_INDEX_MAP]
      if (index) index.delete(link.signal)
      // 销毁当前依赖链接
      destroyDepLink(link)
    }
    // 移动到下一个链接
    link = next
  }
}

/**
 * 跟踪副作用依赖，用于追踪和建立信号依赖关系
 *
 * 此 API 偏向于底层实现，开发者应使用上层API，如 watchEffect、watch 等。
 *
 * @example
 * ```typescript
 * const count = ref(1)
 * trackEffect(() => {
 *   console.log(count.value) // 输出：1
 * })
 * count.value++ // 输出：2
 *
 * // 自定义处理器/回调函数
 * const handler = ()=>{console.log('依赖变化了')}
 * trackEffect(() => count.value,handler)
 * count.value++ // 输出：3 依赖变化了
 *
 * // 获取依赖链
 * const effectDeps = iterateLinkedSignals(handle) // 可迭代的信号依赖链
 * const signalDeps = iterateLinkedEffects(count) // 可迭代的副作用依赖链
 *
 * // 清除依赖关系，下面仅是示例，实际关联和清除都是双向的，仅需要一侧调用即可
 * clearEffectLinks(handle) // 清除副作用链接的所有信号
 * clearSignalLinks(count) // 清除信号链接的所有副作用
 * ```
 *
 * @template T - 函数返回值的类型
 * @param collector - 收集函数，仅在初始化时执行一次，用于收集依赖
 * @param [reactor] - 响应函数，信号变化后重新执行，默认为 collector
 * @returns {T} 返回执行 collector 函数的结果
 */
export function trackEffect<T>(collector: () => T, reactor: EffectRunner = collector): T {
  // 设置跳过跟踪标志为 false，表示需要收集依赖
  const prevPauseTracking = isPauseTracking
  isPauseTracking = false
  // 设置当前活动的效果为传入的 effect
  const preEffect = currentActiveEffect
  currentActiveEffect = reactor
  // 获取并更新效果对象的版本号
  const oldVersion = reactor[DEP_VERSION]
  reactor[DEP_VERSION] = (oldVersion ?? 0) + 1
  try {
    // 执行传入的函数并返回其结果
    return collector()
  } finally {
    // 恢复跳过状态
    isPauseTracking = prevPauseTracking
    // 重置当前活动的效果为 null
    currentActiveEffect = preEffect
    // 完成上一次跟踪运行中的依赖链路，
    // 删除过时的链接，保留本次运行中可访问的链接。
    if (oldVersion != null) finalizeDeps(reactor)
  }
}

/**
 * 处理依赖追踪的函数，用于建立效果(effect)与信号(signal)之间的依赖关系
 *
 * @param effect - 需要追踪的效果对象，实现了DepEffectLike接口
 * @param signal - 被追踪的信号对象
 */
const trackHandler = (effect: EffectRunner, signal: Signal): void => {
  let link: DepLink | undefined // 用于存储依赖链接的变量，初始值为undefined
  // 从效果对象中获取依赖索引映射
  // 注意：DEP_INDEX_MAP 不会在 effect 创建时自动初始化，必须在此处惰性创建。
  // 否则每次 track 都会因 index 为空而走 createDepLink 新建链表节点，
  // 配合 finalizeDeps 的旧节点清理会形成"销毁-重建"循环，导致 triggerSignal 永不终止。
  let index = effect[DEP_INDEX_MAP]
  if (!index) {
    index = effect[DEP_INDEX_MAP] = new WeakMap()
  }

  // 尝试从索引映射中获取信号对应的依赖链接
  link = index.get(signal)

  // 如果不存在依赖链接，则创建一个新的依赖链接
  if (!link) {
    link = createDepLink(effect, signal) // 创建新的依赖链接
    index.set(signal, link) // 存入索引映射，便于后续复用
  }

  // 更新依赖链接中的版本号，与效果对象的当前版本保持一致
  link[DEP_VERSION] = effect[DEP_VERSION]
}

/**
 * 跟踪信号变化的函数
 *
 * `trackSignal` 主要用途是跟踪一个“信号”，使其被活跃的副作用捕获，
 * 通常开发者无需调用它，访问响应式数据时内部会自动调用此 api。
 *
 * @param signal - 需要跟踪的信号对象
 * @param type - 信号操作类型，默认为`get`
 * @param debugData - 可选的调试数据，用于开发环境
 */
export function trackSignal(
  signal: Signal,
  type: SignalOpType = 'get',
  debugData?: ExtraDebugData
): void {
  // 如果当前正在捕获访问信号，则设置当前活动的信号为传入的信号
  if (isHasTracking) currentActiveSignal = signal
  // 跳过跟踪
  if (isPauseTracking || !currentActiveEffect) return
  // 在开发环境下，触发跟踪回调
  if (__VITARX_DEV__) {
    triggerOnTrack({ ...debugData, effect: currentActiveEffect, signal, type })
  }
  // 执行实际的跟踪处理逻辑
  trackHandler(currentActiveEffect, signal)
}

/**
 * 执行一个函数，使其内部访问的信号不会被关联到当前的副作用
 *
 * @example
 * ```typescript
 * const data = reactive({ name: 'vitarx', age: 18 })
 * watchEffect(() => {
 *   console.log(data.name) // 输出：vitarx
 *   console.log(untracked(() => data.age)) // 输出：18，但不会被关联
 * })
 *
 * data.age++ // 不会触发副作用
 * ```
 *
 * @param fn - 需要执行的函数，其内部的依赖关系不会被跟踪
 * @returns - 函数执行的结果
 */
export function untracked<T>(fn: () => T): T {
  // 保存当前的跟踪状态
  const pre = isPauseTracking
  // 暂停跟踪
  isPauseTracking = true
  try {
    // 执行传入的函数
    return fn()
  } finally {
    // 恢复之前的跟踪状态
    isPauseTracking = pre
  }
}

/**
 * 执行一个函数，使其内部访问的信号不会被关联到当前的副作用
 *
 * @deprecated api名称已于 4.0.5 版本废弃，请使用 `untracked` 代替，将于 5.0.0 版本移除
 */
export const untrack = untracked

/**
 * 检测给定的函数中是否触发了追踪信号
 *
 * hasTrack 会执行 fn 并检测其内部是否访问了响应式信号（触发 trackSignal）。
 * fn 内访问的值会按响应式契约正常建立依赖——值被访问了就应该被跟踪。
 * 如需"检测但不建立依赖"，应使用 `untracked` 包裹：
 *
 * @example
 * ```typescript
 * const count = ref(0)
 *
 * // 检测 + 建立依赖（值被访问 → 正常跟踪）
 * const result = hasTrack(() => count.value)
 * console.log(result.isTrack) // 输出：true
 * console.log(result.value)   // 输出：0
 *
 * // 检测但不建立依赖（用 untracked 显式暂停跟踪）
 * const result2 = untracked(() => hasTrack(() => count.value))
 * console.log(result2.isTrack) // 输出：true
 * ```
 *
 * @template V - 函数返回值的类型
 * @param fn - 一个无参数函数，用于检测是否包含信号
 * @returns { { isTrack: boolean; value: V } }
 */
export function hasTrack<V>(fn: () => V): { isTrack: boolean; value: V } {
  const pre = isHasTracking
  // 保存当前 active signal，避免嵌套 hasTrack 调用时互相污染检测结果
  const prevActiveSignal = currentActiveSignal
  isHasTracking = true
  try {
    const value = fn()
    const isTrack = currentActiveSignal !== null
    return { isTrack, value }
  } finally {
    isHasTracking = pre
    // 恢复外层的 active signal，保证嵌套调用各自独立
    currentActiveSignal = prevActiveSignal
  }
}

/**
 * 检查对象的属性是否为响应式信号
 *
 * @example
 * ```typescript
 * const count = ref(0)
 * const result = hasPropTrack(count, 'value')
 * console.log(result.isTrack) // 输出：true
 * console.log(result.value)   // 输出：0
 *
 * const result2 = hasPropTrack({value:0}, 'value')
 * console.log(result2.isTrack) // 输出：false
 * console.log(result2.value)   // 输出：0
 * ```
 *
 * @template T - 对象的类型
 * @template K - 属性的键类型
 * @param obj - 要检查的对象
 * @param key - 要检查的属性键
 * @returns { { isTrack: boolean; value: T[K] } }
 */
export function hasPropTrack<T extends object, K extends keyof T>(
  obj: T,
  key: K
): { isTrack: boolean; value: T[K] } {
  return hasTrack(() => obj[key])
}
