import { type Ref, shallowRef } from '@vitarx/responsive'
import { isFunction, logger, withDelayAndTimeout } from '@vitarx/utils'
import type { ComponentView } from '../core/index.js'
import {
  builder,
  createCommentView,
  createComponentView,
  createSwitchView,
  createView,
  mergeProps,
  type ViewBuilder
} from '../core/index.js'
import { onDispose, onInit, useSuspense } from '../runtime/index.js'
import { isView } from '../shared/index.js'
import type {
  AnyProps,
  Component,
  ComponentProps,
  ExtractProps,
  View,
  WithProps
} from '../types/index.js'

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
 */
function Lazy<T extends Component>(props: LazyProps<T>): View {
  const { delay = 200, timeout = 0, loading, loader, children, inject, onError } = props
  let suspenseCounter: Ref<number> | undefined // 用于计数Suspense的引用
  let cancelTask: (() => void) | undefined = undefined // 用于取消异步任务的函数
  const showView = shallowRef<View>(createCommentView('<Lazy> loading ...')) // 当前显示的视图
  // 如果loading不是视图，则使用Suspense
  if (!isView(loading)) {
    suspenseCounter = useSuspense() // 获取Suspense计数器
    if (suspenseCounter) suspenseCounter.value++ // 增加计数器
  }
  onInit(async (): Promise<void> => {
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
      if (suspenseCounter) suspenseCounter.value--
    }
  })
  onDispose(() => {
    cancelTask?.()
  })
  return createSwitchView(showView)
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
function lazy<T extends Component>(
  loader: () => Promise<{ default: T }>,
  options?: LazyLoadOptions
): ViewBuilder<ComponentProps<T>, ComponentView<typeof Lazy<T>>> {
  return builder((props: ComponentProps<T>): ComponentView<typeof Lazy<T>> => {
    return createComponentView(Lazy, { loader, ...options, inject: props })
  })
}

export { Lazy, lazy, LazyProps, LazyLoadOptions }
