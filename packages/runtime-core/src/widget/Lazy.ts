import { type Ref, shallowRef } from '@vitarx/responsive'
import { withDelayAndTimeout } from '@vitarx/utils'
import { isFunction, logger } from '@vitarx/utils/src/index.js'
import { onDispose, onPrepare, useSuspense } from '../runtime/index.js'
import { isView } from '../shared/index.js'
import type {
  AnyProps,
  ExtractProps,
  View,
  Widget,
  WidgetPropsType,
  WidgetView,
  WithProps
} from '../types/index.js'
import {
  builder,
  createAnchorView,
  createDynamicView,
  createView,
  createWidgetView,
  mergeProps,
  type ViewBuilder
} from '../view/index.js'

/**
 * 惰性加载配置选项
 */
interface LazyLoadOptions {
  /**
   * 加载成功之前要显示的元素
   *
   * 如果传入则会显示，直到加载成功。
   *
   * 如果不传入，则默认向上寻找`Suspense`小部件，使其呈现`fallback`。
   *
   * @defaultValue undefined
   */
  loading?: View
  /**
   * 展示加载组件前的延迟时间
   *
   * @default 200
   */
  delay: number
  /**
   * 超时时间
   *
   * `<=0` 则不限制超时时间。
   *
   * @default 0
   */
  timeout: number
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
interface LazyProps<T extends Widget> extends LazyLoadOptions {
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
  children?: WidgetPropsType<T>['children']
}

/**
 * Lazy组件，用于延迟加载子组件，
 * 提供了延迟加载、超时处理、加载状态显示等功能
 *
 * @param T 泛型参数，必须继承自Widget类型
 * @param delay 延迟加载的时间
 * @param timeout 超时时间
 * @param loading 加载状态的视图
 * @param loader 加载函数，返回Promise
 * @param children 子组件
 * @param inject 注入的属性
 * @param onError 异常处理函数
 */
function Lazy<T extends Widget>({
  delay,
  timeout,
  loading,
  loader,
  children,
  inject,
  onError
}: LazyProps<T>): View {
  let suspenseCounter: Ref<number> | undefined // 用于计数Suspense的引用
  let cancelTask: (() => void) | undefined = undefined // 用于取消异步任务的函数
  const showView = shallowRef<View>(createAnchorView('<Lazy> loading ...')) // 当前显示的视图
  // 如果loading不是视图，则使用Suspense
  if (!isView(loading)) {
    suspenseCounter = useSuspense() // 获取Suspense计数器
    if (suspenseCounter) suspenseCounter.value++ // 增加计数器
  }
  onPrepare(async (): Promise<void> => {
    const task = withDelayAndTimeout(loader, {
      delay,
      timeout,
      onDelay: () => {
        if (isView(loading)) showView.value = loading
      }
    })
    cancelTask = task.cancel
    try {
      const module = await task
      if (module && isFunction(module.default)) {
        const p1 = { children }
        const p = inject ? mergeProps(p1, inject) : p1
        showView.value = createView(module.default, p as ExtractProps<T>)
      }
    } catch (e) {
      if (isFunction(onError)) {
        const fallback = onError(e)
        if (isView(fallback)) showView.value = fallback
      } else {
        logger.error('lazy loading widget module fail: ', e)
      }
    } finally {
      cancelTask = undefined
      // 如果有计数器，则减少计数，不需要使用 nextNick，
      // 因为Suspense内部使用的post调度队列，Suspense更新会晚于Lazy的更新调度
      if (suspenseCounter) suspenseCounter.value--
    }
  })
  onDispose(() => {
    cancelTask?.()
  })
  return createDynamicView(showView)
}
Lazy.defaultProps = {
  delay: 200,
  timeout: 0
}
Lazy.validateProps = (props: AnyProps): void => {
  if (typeof props.loader !== 'function') {
    throw new TypeError(`[Lazy]: loader 期望得到一个异步函数，实际类型为 ${typeof props.loader}`)
  }
  if (props.loading && !isView(props.loading)) {
    throw new TypeError(`[Lazy]: loading 期望得到一个节点对象，实际类型为 ${typeof props.loading}`)
  }
  if (props.onError && typeof props.onError !== 'function') {
    throw new TypeError(`[Lazy]: onError 期望得到一个回调函数，实际类型为 ${typeof props.onError}`)
  }
}

/**
 * 辅助定义一个懒加载组件
 *
 * @example
 * ```ts
 * const Button = lazy(() => import('./Button.js'))
 *
 * function App() {
 *   // color,children都会透传给最终渲染的Button组件
 *   return <Button color="red">按钮</Button>
 * }
 * // 上面的用法等效于
 * // <Lazy loader={() => import('./Button.js')} inject={color="red"}>按钮</Lazy>
 * ```
 *
 * @param loader - 加载器
 * @param [options] - 懒加载组件选项
 * @param [options.delay=200] - 延迟显式loading视图的时间，避免视图闪烁
 * @param [options.timeout=0] - 加载超时时间
 * @param [options.loading] - 加载中显示的节点
 * @param [options.onError] - 处理器加载失败/返回备用View
 * @returns { ViewBuilder } 懒加载组件的视图构建器
 */
function lazy<T extends Widget>(
  loader: () => Promise<{ default: T }>,
  options?: LazyLoadOptions
): ViewBuilder<WidgetPropsType<T>, WidgetView<typeof Lazy<T>>> {
  return builder((props: WidgetPropsType<T>): WidgetView<typeof Lazy<T>> => {
    return createWidgetView(Lazy, { loader, ...options, inject: props })
  })
}

export { Lazy, lazy, LazyProps, LazyLoadOptions }
