import { getActiveEffect, isTrackingPaused } from './collect.js'
import { type ExtraDebugData, type SignalOpType, triggerOnTrack } from './debug.js'
import { createDepLink, DepLink, type EffectHandle, type Signal } from './dep.js'
import { DEP_INDEX_MAP, DEP_VERSION } from './symbol.js'

/**
 * 处理依赖追踪的函数，用于建立效果(effect)与信号(signal)之间的依赖关系
 *
 * @param effect - 需要追踪的效果对象，实现了DepEffectLike接口
 * @param signal - 被追踪的信号对象
 */
function trackHandler(effect: EffectHandle, signal: Signal): void {
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
  // 如果跟踪被暂停，则直接返回，不执行任何操作
  if (isTrackingPaused()) return
  // 获取当前活动的副作用函数
  const activeEffect = getActiveEffect()
  // 如果没有活动的副作用函数，则直接返回
  if (!activeEffect) return
  // 在开发环境下，触发跟踪回调
  if (__DEV__) {
    triggerOnTrack({ ...debugData, effect: activeEffect, signal, type })
  }

  // 执行实际的跟踪处理逻辑
  trackHandler(activeEffect, signal)
}
