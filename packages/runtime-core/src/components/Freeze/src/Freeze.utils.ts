import type { Component, View } from '../../../types/index.js'

/**
 * 清理超出最大缓存数量的视图
 * 采用 LRU (Least Recently Used) 策略，移除最早缓存的视图
 *
 * @param cache - 缓存映射表，key 为组件类型，value 为视图实例
 * @param max - 最大缓存数量
 */
export const pruneCache = (cache: Map<Component, View>, max: number): void => {
  if (max < 1) return
  if (cache.size <= max) return

  const firstType = cache.keys().next().value
  if (!firstType) return

  const firstView = cache.get(firstType)

  if (firstView) {
    firstView.dispose()
    cache.delete(firstType)
  }
}

/**
 * 根据组件类型判断是否应该被缓存
 *
 * @param type - 组件类型
 * @param include - 需要缓存的组件类型列表
 * @param exclude - 不需要缓存的组件类型列表
 * @returns 如果组件满足缓存条件，返回 true
 */
export const shouldCache = (
  type: Component,
  include: Component[],
  exclude: Component[]
): boolean => {
  if (exclude.length && exclude.includes(type)) return false
  if (include.length) return include.includes(type)
  return true
}
