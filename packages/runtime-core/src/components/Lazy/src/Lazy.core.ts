import { shallowRef } from '@vitarx/responsive'
import { isFunction, logger, withDelayTimeout } from '@vitarx/utils'
import { getInstance, onDispose, onInit } from '../../../runtime/index.js'
import { isView } from '../../../shared/index.js'
import type {
  AnyProps,
  Component,
  ComponentProps,
  ExtractProps,
  View,
  WithProps
} from '../../../types/index.js'
import { createCommentView, createView, DynamicView } from '../../../view/index.js'

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
   * // 小部件必须使用`export default`导出，否则会报错。
   * () => import('./YourWidget.js')
   * ```
   */
  loader: () => Promise<{ default: T }>
  /**
   * 需要透传给小部件的属性
   */
  inject?: WithProps<T>
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
  const { delay = 200, timeout = 0, loading, loader, children, inject, onError } = props
  const location = getInstance()!.view.location
  let cancelTask: (() => void) | undefined = undefined // 用于取消异步任务的函数
  const showView = shallowRef<View>(createCommentView('Lazy:loading')) // 当前显示的视图
  onInit(async (): Promise<void> => {
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
    try {
      const module = await task
      if (module && isFunction(module.default)) {
        const p = inject ? inject : ({} as AnyProps)
        if (children && !p.children) p.children = children
        showView.value = createView(module.default, p as ExtractProps<T>)
      }
    } catch (e) {
      if (isFunction(onError)) {
        const fallback = onError(e)
        if (isView(fallback)) showView.value = fallback
      } else {
        logger.error('lazy loading component module fail - ', e, location)
      }
    } finally {
      cancelTask = undefined
    }
  })
  onDispose(() => {
    cancelTask?.()
  })
  return new DynamicView(showView)
}

Lazy.validateProps = (props: AnyProps): void => {
  if (!isFunction(props.loader)) {
    throw new TypeError(`[Lazy]: loader expects an async function, got ${typeof props.loader}`)
  }
  if (props.loading && !isFunction(props.loading)) {
    throw new TypeError(`[Lazy]: loading expects a node object, got ${typeof props.loading}`)
  }
  if (props.onError && !isFunction(props.onError)) {
    throw new TypeError(`[Lazy]: onError expects a callback function, got ${typeof props.onError}`)
  }
}

export { Lazy, type LazyProps, type LazyLoadOptions }
