import { shallowRef } from '@vitarx/responsive'
import { isFunction, logger, withDelayTimeout } from '@vitarx/utils'
import { defineValidate, getInstance, onDispose, onInit } from '../../../runtime/index.js'
import { isView } from '../../../shared/index.js'
import type {
  AnyProps,
  Component,
  ComponentProps,
  ExtractProps,
  View,
  WithProps
} from '../../../types/index.js'
import { createCommentView, createDynamicView, createView } from '../../../view/index.js'
import { LAZY_LOADED_CACHE, LAZY_LOADING_CACHE, type LazyLoader } from './Lazy.cache.js'

/**
 * 惰性加载配置选项
 */
interface LazyLoadOptions {
  /**
   * 加载视图构建函数
   *
   * 默认向上寻找 `Suspense` 组件，使其呈现 `fallback` (优先级高于loading)。
   */
  loading?: () => View
  /**
   * 展示加载组件前的延迟时间
   *
   * @default 200
   */
  delay?: number
  /**
   * 超时时间
   *
   * `<=0` 则不限制超时时间。
   *
   * @default 0
   */
  timeout?: number
  /**
   * 异常处理钩子
   *
   * @param error - 捕获到的异常
   * @returns { View } - 返回一个视图，用于显示异常信息
   */
  onError?: (e: unknown) => View
}

/**
 * Lazy 支持的属性
 */
interface LazyProps<T extends Component> extends LazyLoadOptions {
  /**
   * 接收一个惰性加载器
   *
   * @example
   * ```ts
   * // 组件必须使用`export default`导出，否则会报错。
   * () => import('./YourWidget.js')
   * ```
   */
  loader: LazyLoader<T>
  /**
   * 绑定给加载组件的属性
   */
  props?: WithProps<T>
  /**
   * 原样透传给加载完成后的组件
   */
  children?: ComponentProps<T>['children']
}

/**
 * Lazy组件，用于延迟加载子组件，
 * 提供了延迟加载、超时处理、加载状态显示等功能
 *
 * @template T - 子组件类型
 * @param { LazyProps<T> } props - 惰性加载配置选项
 * @returns { View } - 返回一个视图，用于延迟加载子组件
 *
 * @example
 * ```ts
 * function App() {
 *   return (
 *     <Lazy
 *       loader={() => import('./MyAsyncComponent')}
 *       loading={() => <div>Loading...</div>},
 *       timeout={5000},
 *       onError={(e) => <div>Error: {e.message}</div>}
 *     />
 *   )
 * }
 * ```
 */
function Lazy<T extends Component>(props: LazyProps<T>): View {
  const { delay = 200, timeout = 0, loading, loader, props: _props, onError } = props
  const resolvedProps: AnyProps = _props ? _props : {}

  if ('children' in props) {
    Object.defineProperty(resolvedProps, 'children', {
      enumerable: true,
      configurable: true,
      get() {
        return props.children
      }
    })
  }

  const cached = LAZY_LOADED_CACHE.get(loader as LazyLoader<Component>)
  if (cached) return createView(cached, resolvedProps)

  const location = getInstance()!.view.location
  let cancelTask: (() => void) | undefined = undefined
  const showView = shallowRef<View>(createCommentView('Lazy:loading'))

  onInit(async (): Promise<void> => {
    let loadingPromise = LAZY_LOADING_CACHE.get(loader)

    if (!loadingPromise) {
      const task = withDelayTimeout(loader, {
        delay,
        timeout,
        onDelay: () => {
          if (isFunction(loading)) {
            const loadingView = loading()
            if (isView(loadingView)) showView.value = loadingView
          }
        }
      })
      cancelTask = task.cancel

      loadingPromise = task
        .then(module => {
          if (module && isFunction(module.default)) {
            LAZY_LOADED_CACHE.set(loader, module.default)
            LAZY_LOADING_CACHE.delete(loader as LazyLoader<Component>)
            return module.default
          }
          throw new Error('Invalid component module')
        })
        .catch(e => {
          LAZY_LOADING_CACHE.delete(loader as LazyLoader<Component>)
          throw e
        })

      LAZY_LOADING_CACHE.set(loader as LazyLoader<Component>, loadingPromise)
    }

    try {
      const component = await loadingPromise
      showView.value = createView(component, resolvedProps as ExtractProps<T>)
    } catch (e) {
      if (isFunction(onError)) {
        const fallback = onError(e)
        if (isView(fallback)) showView.value = fallback
      } else {
        logger.error('[Lazy] Failed to load component module', e, location)
      }
    } finally {
      cancelTask = undefined
    }
  })

  onDispose(() => {
    cancelTask?.()
  })
  return createDynamicView(showView)
}

defineValidate(Lazy, (props: AnyProps): void => {
  if (!isFunction(props.loader)) {
    throw new TypeError(`[Lazy] loader expects a function, received ${typeof props.loader}`)
  }
  if (props.loading && !isFunction(props.loading)) {
    throw new TypeError(`[Lazy] loading expects a function, received ${typeof props.loading}`)
  }
  if (props.onError && !isFunction(props.onError)) {
    throw new TypeError(`[Lazy] onError expects a function, received ${typeof props.onError}`)
  }
})

export { Lazy, type LazyLoadOptions, type LazyProps }
