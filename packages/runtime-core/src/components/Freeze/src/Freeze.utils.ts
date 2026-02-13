import { isComponentView } from '../../../shared/index.js'
import type { Component, View } from '../../../types/index.js'
import type { ComponentView } from '../../../view/implements/index.js'

/**
 * 清理超出最大缓存数量的视图
 * 采用 LRU (Least Recently Used) 策略，移除最早缓存的视图
 *
 * @param cache - 缓存映射表，key 为组件类型，value 为视图实例
 * @param max - 最大缓存数量
 */
export const pruneCache = (cache: Map<Component, View>, max: number): void => {
  // max 小于 1 表示不限制缓存数量
  if (max < 1) return
  // 当前缓存数量未超过限制，无需清理
  if (cache.size <= max) return

  // 获取最早缓存的组件类型（Map 的迭代顺序保证）
  const firstType = cache.keys().next().value
  if (!firstType) return

  // 获取对应的视图实例
  const firstView = cache.get(firstType)

  if (firstView) {
    // 销毁视图，释放资源
    firstView.dispose()
    // 从缓存中移除
    cache.delete(firstType)
  }
}

/**
 * 判断视图是否应该被缓存
 *
 * @param view - 待判断的视图
 * @param include - 需要缓存的组件类型列表
 * @param exclude - 不需要缓存的组件类型列表
 * @returns 如果视图是组件视图且满足缓存条件，返回 true
 */
export const shouldCache = (
  view: View,
  include: Component[],
  exclude: Component[]
): view is ComponentView => {
  // 非组件视图不能缓存
  if (!isComponentView(view)) return false

  const type = view.component
  // 排除列表优先级最高
  if (exclude.length && exclude.includes(type)) return false
  // 如果指定了包含列表，只缓存列表中的组件
  if (include.length) return include.includes(type)
  // 默认情况下缓存所有组件
  return true
}
