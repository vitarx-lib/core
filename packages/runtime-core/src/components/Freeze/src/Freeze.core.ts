import { defineValidate, getRenderer, onDispose, onViewSwitch } from '../../../runtime/index.js'
import { isDynamicView, isView } from '../../../shared/index.js'
import type { Component, View } from '../../../types/index.js'
import { pruneCache, shouldCache } from './Freeze.utils.js'

/**
 * Freeze 组件属性接口
 */
interface FreezeProps {
  /** 需要被缓存的子视图 */
  children: View
  /** 需要缓存的组件类型列表，如果指定则只缓存列表中的组件 */
  include?: Component[]
  /** 不需要缓存的组件类型列表，优先级高于 include */
  exclude?: Component[]
  /**
   * 最大缓存数量，默认为 0 表示不限制
   *
   * @default 0
   */
  max?: number
}

/**
 * Freeze 组件实现
 * 用于缓存和复用组件视图，避免重复创建和销毁，提升性能
 *
 * 工作原理：
 * 1. 监听视图切换事件（onViewSwitch）
 * 2. 当视图切换时，将旧视图（prev）冻结（响应式停止）并缓存
 * 3. 当新视图（next）需要显示时，优先从缓存中复用（恢复响应式）
 * 4. 组件销毁时，清理所有缓存的视图
 *
 * @example
 * ```jsx
 * // 基础用法：条件渲染缓存
 * <Freeze>
 *   { cond ? <ComponentA /> : <ComponentB />}
 * </Freeze>
 * // 组合Dynamic：动态渲染缓存
 * <Freeze>
 *   <Dynamic is={activeComponent} />
 * </Freeze>
 * ```
 * @example
 * ```jsx
 * // 使用 include 只缓存指定组件
 * <Freeze include={[ComponentA, ComponentB]}>
 *   <Dynamic is={activeComponent} />
 * </Freeze>
 * ```
 * @example
 * ```jsx
 * // 使用 exclude 排除不需要缓存的组件
 * <Freeze exclude={[ComponentC]}>
 *   <Dynamic is={activeComponent} />
 * </Freeze>
 * ```
 * @example
 * ```jsx
 * // 限制最大缓存数量
 * <Freeze max={3}>
 *   <Dynamic is={activeComponent} />
 * </Freeze>
 * ```
 *
 * @param props - Freeze 组件属性
 * @returns {View} 返回子视图
 */
function Freeze(props: FreezeProps): View {
  const { include = [], exclude = [], max = 0, children } = props
  if (!isDynamicView(children)) {
    return children
  }

  /**
   * 缓存映射表
   * key: 组件类型
   * value: 组件视图实例
   */
  const cache = new Map<Component, View>()

  /**
   * 监听视图切换事件
   * 在视图切换时拦截，实现视图的缓存和复用
   */
  onViewSwitch((tx): false | void => {
    const renderer = getRenderer()
    let reuse: View | undefined = undefined
    const { next, prev } = tx
    // 1️⃣ 处理 next（即将显示的视图）：尝试复用缓存
    if (shouldCache(next, include, exclude)) {
      const type = next.component
      // 查找缓存
      const cachedView = cache.get(type)
      if (cachedView) {
        // 从缓存中移除（因为即将被激活使用）
        cache.delete(type)
        if (prev.isMounted) {
          // 重新插入节点
          renderer.insert(cachedView.node, prev.node)
        }
        // 激活缓存的视图（恢复事件监听等）
        cachedView.activate()
        reuse = cachedView
      }
    }
    // 如果next没有被复用，则需要先挂载next
    if (!reuse) {
      next.init(prev.ctx)
      if (prev.isMounted) next.mount(prev.node, 'insert')
      reuse = next
    }
    // 2️⃣  处理 prev（即将离开的视图）：冻结并缓存
    if (shouldCache(prev, include, exclude)) {
      const type = prev.component
      // 移除DOM节点
      renderer.remove(prev.node)
      // 冻结视图
      prev.deactivate()
      // 存入缓存
      cache.set(type, prev)
      // 检查并清理超出限制的缓存
      pruneCache(cache, max)
    } else {
      prev.dispose()
    }
    tx.commit({ next: reuse, mode: 'pointer-only' })
    return false
  })

  /**
   * Freeze 组件销毁时的清理逻辑
   * 当 Freeze 组件被销毁时，需要清理所有缓存的视图
   * 避免内存泄漏
   */
  onDispose(() => {
    // 如果没有缓存，直接返回
    if (cache.size === 0) return
    // 遍历所有缓存的视图并销毁
    for (const view of cache.values()) {
      view.dispose()
    }
    // 清空缓存映射表
    cache.clear()
  })

  return children
}
defineValidate(Freeze, props => {
  if (!isView(props.children)) {
    throw new Error(
      `[Freeze]: children property expects to get a view object, given ${typeof props.children}`
    )
  }
})
export { Freeze, type FreezeProps }
