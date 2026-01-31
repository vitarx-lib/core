import type { AnyFunction } from '@vitarx/utils'
import { type ExtraDebugData, type SignalOpType, triggerOnTrack } from './debug.js'
import { createDepLink, DepLink, destroyDepLink, type EffectRunner, type Signal } from './dep.js'
import { DEP_INDEX_MAP, DEP_VERSION, EFFECT_DEP_HEAD } from './symbol.js'

let currentActiveEffect: EffectRunner | null = null
let currentActiveSignal: Signal | null = null

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
  const preEffect = currentActiveEffect
  // 获取并更新效果对象的版本号
  const oldVersion = reactor[DEP_VERSION]
  reactor[DEP_VERSION] = (oldVersion ?? 0) + 1
  try {
    // 设置当前活动的效果为传入的 effect
    currentActiveEffect = reactor
    // 执行传入的函数并返回其结果
    return collector()
  } finally {
    // 无论执行成功与否，最终都会执行以下代码
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
  const index = effect[DEP_INDEX_MAP]

  // 如果存在依赖索引映射，尝试从中获取信号对应的依赖链接
  if (index) {
    link = index.get(signal)
  }

  // 如果不存在依赖链接，则创建一个新的依赖链接
  if (!link) {
    link = createDepLink(effect, signal) // 创建新的依赖链接
    // 如果存在依赖索引映射，则将新创建的链接存入映射中
    if (index) index.set(signal, link)
  }

  // 更新依赖链接中的版本号，与效果对象的当前版本保持一致
  link[DEP_VERSION] = effect[DEP_VERSION]
}

/**
 * 跟踪信号变化的函数
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
  // ✅ 无论有没有 effect，都允许标记 signal 被访问
  if (currentActiveSignal === null) {
    currentActiveSignal = signal
  }
  // 获取当前活动的副作用函数
  const activeEffect = currentActiveEffect
  // 如果没有活动的副作用函数，则直接返回
  if (!activeEffect) return
  // 在开发环境下，触发跟踪回调
  if (__DEV__) {
    triggerOnTrack({ ...debugData, effect: activeEffect, signal, type })
  }
  // 执行实际的跟踪处理逻辑
  trackHandler(activeEffect, signal)
}

/**
 * 检查给定的函数中是否有跟踪信号
 *
 * 该 api 用于判断函数执行过程中是否有信号被跟踪。
 *
 * @param fn - 一个无参数函数，用于检测是否包含信号
 * @returns {boolean} 如果getter函数执行过程中有信号则返回true，否则返回false
 */
export function hasTrack(fn: AnyFunction): boolean {
  const pre = currentActiveSignal
  currentActiveSignal = null
  try {
    fn()
    // noinspection PointlessBooleanExpressionJS
    return currentActiveSignal !== null
  } finally {
    currentActiveSignal = pre
  }
}

/**
 * 检查对象的属性上是否有信号跟踪
 *
 * 该 api 可以高效的判断一个对象属性是否具有响应性。
 *
 * @param obj - 要检查的对象
 * @param key - 要检查的属性键
 * @returns { boolean } 如果属性上有信号跟踪则返回true，否则返回false
 */
export function hasPropTrack<T extends object>(obj: T, key: keyof T): boolean {
  const pre = currentActiveSignal
  currentActiveSignal = null
  try {
    obj[key]
    // noinspection PointlessBooleanExpressionJS
    return currentActiveSignal !== null
  } finally {
    currentActiveSignal = pre
  }
}
