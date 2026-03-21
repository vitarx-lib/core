import { logger } from '@vitarx/utils'
import { onDispose, onViewSwitch } from '../../../runtime/index.js'
import { isComponent, isComponentView } from '../../../shared/index.js'
import type { AnyProps, Component, View } from '../../../types/index.js'
import { DynamicViewSource } from '../../../view/compiler/source.js'
import { createCommentView, createView, DynamicView } from '../../../view/index.js'
import { pruneCache, shouldCache } from './Freeze.utils.js'

/**
 * Freeze 组件属性接口
 */
interface FreezeProps {
  /**
   * 动态组件类型
   *
   * 可以是组件函数或响应式引用
   */
  is: Component | null | undefined | false
  /**
   * 唯一标识
   *
   * 如需使同一个组件永远不同的实例，可以传入一个`key`标识，它需和`is`传入的组件保持关联。
   */
  key?: unknown
  /**
   * 传递给组件的属性对象
   *
   * @example
   * ```jsx
   * const showComponent = ref(ComponentA)
   * // 静态属性对象
   * <Freeze is={showComponent} props={{ message: 'Hello, World!' }} />
   * // 响应式属性对象
   * const someProps = reactive({ message: 'Hello, World!' })
   * <Freeze is={showComponent} props={someProps} />
   * ```
   */
  props?: AnyProps | null | undefined
  /**
   * 需要缓存的组件类型列表，如果指定则只缓存列表中的组件
   */
  include?: Component[]
  /**
   * 不需要缓存的组件类型列表，优先级高于 include
   */
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
 * 1. 监听 `is` 属性的变化
 * 2. 当组件切换时，将旧组件冻结（响应式停止）并缓存
 * 3. 当新组件需要显示时，优先从缓存中复用（恢复响应式）
 * 4. 组件销毁时，清理所有缓存的视图
 *
 * @example
 * ```tsx
 * // 基础用法：动态组件缓存
 * const current = ref(ComponentA)
 * <Freeze is={current} />
 * ```
 * @example
 * ```tsx
 * // 使用 include 只缓存指定组件
 * <Freeze is={current} include={[ComponentA, ComponentB]} />
 * ```
 * @example
 * ```tsx
 * // 使用 exclude 排除不需要缓存的组件
 * <Freeze is={current} exclude={[ComponentC]} />
 * ```
 * @example
 * ```tsx
 * // 限制最大缓存数量
 * <Freeze is={current} max={3} />
 * ```
 * @example
 * ```tsx
 * // 传递属性给组件
 * <Freeze is={current} props={{ data: someData }} />
 * ```
 *
 * @param props - Freeze 组件属性
 * @returns {View} 返回当前激活的视图
 */
function Freeze(props: FreezeProps): View {
  const { include = [], exclude = [], max = 0 } = props

  /**
   * 缓存映射表
   * key: 组件类型
   * value: Map<key, View> 组件的 key 到视图实例的映射
   */
  const cache = new Map<Component, Map<unknown, View>>()

  /**
   * 视图到 key 的映射
   * 用于在视图切换时获取正确的 key
   */
  const viewKeyMap = new WeakMap<View, unknown>()

  /**
   * 切换到指定组件
   */
  const switchTo = new DynamicViewSource((): View => {
    const component = props.is
    const key = props.key
    if (!component) {
      return createCommentView(`<Freeze is={${String(component)}} />`)
    }
    if (!isComponent(component)) {
      if (__VITARX_DEV__) {
        logger.warn('[Freeze] props.is is not a valid component.')
      }
      return createCommentView('[Freeze] props.is is not a valid component.')
    }
    // 尝试从缓存获取
    if (shouldCache(component, include, exclude)) {
      const keyMap = cache.get(component)
      if (keyMap) {
        const cached = keyMap.get(key)
        if (cached) {
          // 从缓存中删除，避免在卸载Freeze时超前卸载子视图
          keyMap.delete(key)
          if (keyMap.size === 0) {
            cache.delete(component)
          }
          return cached
        }
      }
    }
    // 创建新视图并记录 key
    const view = createView(component, props.props)
    viewKeyMap.set(view, key)
    return view
  })
  // 如果是静态视图，则直接返回，减少钩子注册开销
  if (switchTo.isStatic) {
    if (__VITARX_DEV__) {
      logger.warn('[Freeze] props.is is a static component, freeze will not work as expected.')
    }
    return switchTo.value
  }

  /**
   * 监听视图切换事件，配置缓存行为
   */
  onViewSwitch(tx => {
    if (isComponentView(tx.prev)) {
      // prev 需要缓存
      const prevComponent = tx.prev.component
      if (shouldCache(prevComponent, include, exclude)) {
        tx.cachePrev = true
        // 获取或创建该组件的 key 映射
        let keyMap = cache.get(prevComponent)
        if (!keyMap) {
          keyMap = new Map<unknown, View>()
          cache.set(prevComponent, keyMap)
        }
        // 从映射中获取 prev 视图关联的 key
        const prevKey = viewKeyMap.get(tx.prev)
        keyMap.set(prevKey, tx.prev)
        pruneCache(cache, max)
      }
    }
  })

  /**
   * Freeze 组件销毁时的清理逻辑
   */
  onDispose(() => {
    // 清理所有缓存的视图
    if (cache.size > 0) {
      for (const keyMap of cache.values()) {
        for (const view of keyMap.values()) {
          view.dispose()
        }
        keyMap.clear()
      }
      cache.clear()
    }
  })

  // 返回动态视图
  return new DynamicView(switchTo)
}
export { Freeze, type FreezeProps }
