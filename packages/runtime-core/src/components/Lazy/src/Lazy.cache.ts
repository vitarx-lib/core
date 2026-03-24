import type { Component } from '../../../types/index.js'

/**
 * ES组件模块懒加载器类型
 */
export type LazyLoader<T extends Component> = () => Promise<{ default: T }>

export const LAZY_LOADED_CACHE = new WeakMap<LazyLoader<Component>, Component>()
export const LAZY_LOADING_CACHE = new WeakMap<LazyLoader<Component>, Promise<Component>>()

/**
 * 预加载组件并存入缓存
 *
 * 此函数用于提前加载懒加载组件，避免在实际使用时的延迟。
 * 加载成功后组件会被缓存，后续使用时直接从缓存获取。
 *
 * @template T - 组件类型
 * @param loader - 懒加载器函数
 * @returns {Promise<T>} 返回加载成功的组件
 * @throws {Error} 如果加载失败或模块格式无效
 *
 * @example
 * ```ts
 * // 在路由切换前预加载组件
 * const loader = () => import('./MyComponent.js')
 *
 * // 预加载
 * preloadComponent(loader)
 *   .then(() => console.log('组件预加载成功'))
 *   .catch(err => console.error('预加载失败', err))
 * ```
 */
export async function preloadComponent<T extends Component>(loader: LazyLoader<T>): Promise<T> {
  const cachedLoader = loader as LazyLoader<Component>

  const cached = LAZY_LOADED_CACHE.get(cachedLoader)
  if (cached) return cached as T

  const loadingPromise = LAZY_LOADING_CACHE.get(cachedLoader)
  if (loadingPromise) return loadingPromise as Promise<T>

  const promise = loader()
    .then(module => {
      if (module && typeof module.default === 'function') {
        LAZY_LOADED_CACHE.set(cachedLoader, module.default)
        return module.default
      }
      throw new Error('Invalid component module: missing default export')
    })
    .finally(() => {
      LAZY_LOADING_CACHE.delete(cachedLoader)
    })

  LAZY_LOADING_CACHE.set(cachedLoader, promise as Promise<Component>)

  return promise as Promise<T>
}

/**
 * 获取已缓存的组件
 *
 * @template T - 组件类型
 * @param loader - 懒加载器函数
 * @returns {T | undefined} 返回缓存的组件，如果未缓存则返回 undefined
 *
 * @example
 * ```ts
 * const loader = () => import('./MyComponent.js')
 *
 * const cached = getCachedComponent(loader)
 * if (cached) {
 *   // 直接使用缓存的组件
 *   const view = createView(cached, { children: 'Hello' })
 * }
 * ```
 */
export function getCachedComponent<T extends Component>(loader: LazyLoader<T>): T | undefined {
  return LAZY_LOADED_CACHE.get(loader as LazyLoader<Component>) as T | undefined
}

/**
 * 获取正在加载中的组件 Promise
 *
 * 用于路由等外部模块等待异步组件加载完成。
 * 如果组件正在加载中，返回该 Promise；
 * 如果已经加载完成或未开始加载，返回 void。
 *
 * @param loader - 懒加载器函数
 * @returns {Promise<Component> | void} 返回加载中的 Promise 或 void
 *
 * @example
 * ```js
 * const loader = () => import('./MyComponent.js')
 *
 * // 在路由跳转后尝试等待
 * const loading = getLoadingComponent(loader)
 * if (loading) {
 *   await loading
 *   // 此时组件 JS 已加载完毕，且已存入 LAZY_LOADED_CACHE
 *   await nextTick()
 *   // 如果不是预加载，此时可以安全的获取布局信息
 * }
 * ```
 */
export function getLoadingComponent(loader: LazyLoader<Component>): Promise<Component> | void {
  return LAZY_LOADING_CACHE.get(loader)
}

/**
 * 清除指定 loader 的所有缓存
 *
 * 同时清除已加载缓存和加载中缓存
 *
 * 注意：谨慎使用，仅应用于测试环境。
 *
 * @param loader - 懒加载器函数
 *
 * @example
 * ```ts
 * const loader = () => import('./MyComponent.js')
 *
 * // 清除缓存，下次使用时会重新加载
 * clearComponentCache(loader)
 * ```
 */
export function clearComponentCache(loader: LazyLoader<Component>): void {
  LAZY_LOADED_CACHE.delete(loader)
  LAZY_LOADING_CACHE.delete(loader)
}
