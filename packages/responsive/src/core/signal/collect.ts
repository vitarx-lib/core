import { destroyDepLink, type EffectHandle } from './dep.js'
import { DEP_INDEX_MAP, DEP_VERSION, EFFECT_DEP_HEAD } from './symbol.js'

let currentActiveEffect: EffectHandle | null = null
let isTrackingSuspended = false

/**
 * 获取当前活动的副作用函数
 * 该函数用于获取当前正在执行的副作用函数，通常用于响应式系统中的依赖收集
 *
 * @returns 返回当前活动的副作用函数(DepEffectLike类型)，如果没有则返回null
 */
export function getActiveEffect(): EffectHandle | null {
  return currentActiveEffect // 返回当前活动的副作用函数
}

/**
 * 判断跟踪是否已暂停
 * 该函数用于获取当前跟踪状态是否处于暂停状态
 *
 * @returns {boolean} 返回布尔值，true表示跟踪已暂停，false表示跟踪正在进行中
 */
export function isTrackingPaused(): boolean {
  return isTrackingSuspended // 返回跟踪是否暂停的状态变量
}
/**
 * 暂停依赖追踪的辅助函数
 *
 * 这个函数主要用于在执行某些操作时临时暂停响应式系统的依赖追踪，
 * 执行完操作后无论成功与否都会恢复依赖追踪状态。
 *
 * @param fn - 需要在暂停依赖追踪状态下执行的函数
 * @returns - 执行传入函数后的返回值
 */
export function withSuspendedTracking<T>(fn: () => T): T {
  // 设置依赖追踪为暂停状态
  isTrackingSuspended = true
  try {
    // 执行传入的函数
    return fn()
  } finally {
    // 无论执行结果如何，最终都会恢复依赖追踪状态
    isTrackingSuspended = false
  }
}

/**
 * 窥视对象值，不触发跟踪
 *
 * @template T - 信号的值类型
 * @returns - 返回对应值
 * @param sig - 信号对象
 * @param key - 访问的属性名
 */
export function peekSignal<T extends object, K extends keyof T>(sig: T, key: K): T[K] {
  // 暂停信号跟踪
  isTrackingSuspended = true
  // 读取信号值
  const value = sig[key]
  // 恢复信号跟踪
  isTrackingSuspended = false
  // 返回获取到的值
  return value
}

/**
 * 处理并清理依赖关系
 * 该函数用于遍历effect的所有依赖链接，移除过时的依赖关系，并清理不再需要的链接
 * @param effect - 需要处理的依赖效果对象，包含依赖关系和版本信息
 */
function finalizeDeps(effect: EffectHandle): void {
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
 * 收集信号，用于追踪和建立函数执行期间的依赖关系
 *
 * 此 API 偏向于底层实现，开发者应使用上层API，如 watchEffect、watch 等。
 *
 * @example
 * ```typescript
 * const count = ref(1)
 * // 收集信号，并建立依赖
 * collectSignal(() => {
 *   console.log(count.value) // 输出：1
 * })
 * count.value++ // 输出：2
 *
 * // 自定义句柄/回调函数
 * const handle = ()=>{console.log('依赖变化了')}
 * collectSignal(() => count.value,handle)
 * count.value++ // 输出：3 依赖变化了
 *
 * // 获取依赖链
 * const effectDeps = iterateLinkedSignals(handle) // 可迭代的信号依赖链
 * const signalDeps = iterateLinkedEffects(count) // 可迭代的副作用依赖链
 *
 * // 清除依赖关系，下面仅是示例，实际上的关联和清除都是双向的，仅需要一侧调用即可
 * clearEffectLinks(handle) // 清除副作用链接的所有信号
 * clearSignalLinks(count) // 清除信号链接的所有副作用
 * ```
 *
 * @template T - 函数返回值的类型
 * @param effect - 需要执行的副作用函数，收集信号
 * @param [handle] - 副作用句柄，绑定给信号，如果不传入则默认为 effect
 * @returns {T} 返回执行 fn 函数的结果
 */
export function collectSignal<T>(effect: () => T, handle: EffectHandle = effect): T {
  const preEffect = currentActiveEffect
  // 获取并更新效果对象的版本号
  const oldVersion = handle[DEP_VERSION]
  handle[DEP_VERSION] = (oldVersion ?? 0) + 1
  try {
    // 设置当前活动的效果为传入的 effect
    currentActiveEffect = handle
    // 执行传入的函数并返回其结果
    return effect()
  } finally {
    // 无论执行成功与否，最终都会执行以下代码
    // 重置当前活动的效果为 null
    currentActiveEffect = preEffect
    // 如果存在旧版本号，则完成依赖关系的最终处理
    if (oldVersion) finalizeDeps(handle)
  }
}
