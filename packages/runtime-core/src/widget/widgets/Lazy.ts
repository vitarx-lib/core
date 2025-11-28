import { Ref } from '@vitarx/responsive'
import { withDelayAndTimeout } from '@vitarx/utils'
import { useSuspense } from '../../runtime/index.js'
import type {
  AnyProps,
  ErrorHandler,
  LazyLoadWidget,
  Renderable,
  VNode,
  WidgetTypes,
  WithProps
} from '../../types/index.js'
import { isVNode } from '../../utils/index.js'
import { createVNode } from '../../vnode/index.js'
import { Widget } from '../base/index.js'

/**
 * 惰性加载小部件配置选项
 */
export interface LazyWidgetProps<P extends AnyProps, T extends WidgetTypes = WidgetTypes> {
  /**
   * 接收一个惰性加载器
   *
   * @example
   * ```ts
   * // 小部件必须使用`export default`导出，否则会报错。
   * () => import('./YourWidget.js')
   * ```
   */
  children: LazyLoadWidget<P, T>
  /**
   * 需要透传给小部件的属性
   */
  injectProps?: WithProps<T>
  /**
   * 加载成功之前要显示的元素
   *
   * 如果传入则会显示，直到加载成功。
   *
   * 如果不传入，则默认向上寻找`Suspense`小部件，使其呈现`fallback`。
   *
   * @defaultValue undefined
   */
  loading?: VNode
  /**
   * 异常处理钩子
   *
   * @param error - 捕获到的异常，通常是Error对象，也有可能是子组件抛出的其他异常
   * @param info - 捕获异常的阶段，可以是`build`或`render`
   */
  onError?: ErrorHandler<Lazy<T>>
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
}

/**
 * 惰性加载小部件
 *
 * `children`传入的小部件会被异步加载，加载完成过后自动渲染到视图中。
 *
 * 示例：
 * ```jsx
 * const YourWidget = () => import('./YourWidget.js')
 * // 通过属性传入
 * <Lazy children={YourWidget} />
 * // 通过插槽传入
 * <Lazy>{YourWidget}</LazyWidget>
 * // 自定义loading态备用小部件
 * <Lazy loading={<div>加载中...</div>}/>
 * // onError钩子接管异常
 * <Lazy onError={()=><div>加载失败...</div>}/>
 * // 2.0 版本开始框架支持直接渲染异步组件模块
 * <YourWidget data="数据会透传给最终渲染的组件"/>
 * ```
 */
export class Lazy<T extends WidgetTypes = WidgetTypes> extends Widget<LazyWidgetProps<T>> {
  static defaultProps = {
    delay: 200,
    timeout: 0
  }

  /** Suspense 计数器引用 */
  protected suspenseCounter: Ref<number> | undefined = undefined

  /** 取消异步加载任务的函数 */
  private _cancelTask?: () => void

  constructor(props: LazyWidgetProps<T>) {
    super(props)
    this.onError = props.onError
    this.suspenseCounter = useSuspense()
    if (this.suspenseCounter) {
      this.suspenseCounter.value++
    }
  }
  /**
   * 验证组件属性是否符合要求
   *
   * @param props - 组件属性对象
   * @throws {TypeError} 当属性不符合要求时抛出类型错误
   */
  static validateProps(props: AnyProps): void {
    if (typeof props.children !== 'function') {
      throw new TypeError(
        `[LazyWidget]: children 期望得到一个异步函数，实际类型为 ${typeof props.children}`
      )
    }
    if (props.loading && !isVNode(props.loading)) {
      throw new TypeError(
        `[LazyWidget]: loading 期望得到一个节点对象，实际类型为 ${typeof props.loading}`
      )
    }
    if (props.onError && typeof props.onError !== 'function') {
      throw new TypeError(
        `[LazyWidget]: onError 期望得到一个回调函数，实际类型为 ${typeof props.onError}`
      )
    }
  }

  override onBeforeUnmount(): void {
    this._cancelTask?.()
  }

  override onRender(): Promise<void> {
    return this._loadAsyncWidget()
  }

  override build(): Renderable {
    return undefined
  }

  /**
   * 加载异步组件
   *
   * @protected
   */
  protected async _loadAsyncWidget(): Promise<void> {
    const { delay, timeout, loading } = this.props

    const task = withDelayAndTimeout(this.children, {
      delay,
      timeout,
      onDelay: () => {
        if (isVNode(loading)) {
          this._updateBuild(() => loading)
        }
      }
    })
    this._cancelTask = task.cancel
    try {
      const { default: widget } = await task
      this._updateBuild(() => createVNode(widget, this.props.injectProps))
    } catch (e) {
      this._updateBuild(() => {
        throw e
      })
    } finally {
      this._cancelTask = undefined
    }
  }

  /**
   * 更新构建函数并强制刷新组件
   *
   * @param builder - 新的构建函数
   * @private
   */
  private _updateBuild(builder: () => Renderable): void {
    this.build = builder
    this.$forceUpdate()
    if (this.suspenseCounter) this.suspenseCounter.value--
  }
}
