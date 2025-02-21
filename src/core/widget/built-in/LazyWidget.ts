import { type Element, Widget } from '../widget.js'
import {
  createVNode,
  Fragment,
  isVNode,
  type WidgetPropsType,
  type WidgetType
} from '../../vnode/index.js'
import { getSuspenseCounter } from './Suspense.js'
import type { Ref } from '../../responsive/index.js'
import type { ErrorInfo } from '../life-cycle.js'
import Logger from '../../logger.js'
import { isRecordObject } from '../../../utils/index.js'

/**
 * 代码分块懒加载
 *
 * 用箭头函数返回import()，不会构建在入口js文件中，而是单独分包，在需要时才会加载。
 */
export type LazyLoader<T extends WidgetType> = () => Promise<{ default: T }>

/**
 * onError生命周期钩子
 *
 * @param {unknown} error - 捕获到的异常，通常是Error对象，也有可能是子组件抛出的其他异常
 * @param {ErrorInfo} info - 捕获异常的阶段，可以是`build`或`render`
 * @returns {void|Element} - 可以返回一个`Element`虚拟节点，做为后备内容展示。
 */
export type LazyWidgetErrorCallback<T extends WidgetType> = (
  this: LazyWidget<T>,
  error: unknown,
  info: ErrorInfo
) => void | Element

/**
 * 惰性加载小部件配置选项
 */
export interface LazyWidgetProps<T extends WidgetType> {
  /**
   * 接收一个惰性加载器
   *
   * @example
   * // 小部件必须使用`export default`导出，否则会报错。
   * () => import('./YourWidget.js')
   */
  children: LazyLoader<T>
  /**
   * 需要透传给小部件的属性
   */
  injectProps?: WidgetPropsType<T>
  /**
   * 加载成功之前要显示的元素
   *
   * 如果传入则会显示，直到加载成功。
   *
   * 如果不传入，则默认向上寻找`Suspense`小部件，使其呈现`fallback`。
   *
   * @defaultValue undefined
   */
  loading?: Element
  /**
   * 异常处理钩子
   *
   * @param error - 捕获到的异常，通常是Error对象，也有可能是子组件抛出的其他异常
   * @param info - 捕获异常的阶段，可以是`build`或`render`
   */
  onError?: LazyWidgetErrorCallback<T>
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
 * <LazyWidget children={YourWidget} />
 * // 通过插槽传入
 * <LazyWidget>{YourWidget}</LazyWidget>
 * // 自定义loading态备用小部件
 * <LazyWidget loading={<div>加载中...</div>}/>
 * // onError钩子接管异常
 * <LazyWidget onError={()=><div>加载失败...</div>}/>
 * ```
 */
export class LazyWidget<T extends WidgetType> extends Widget<LazyWidgetProps<T>> {
  /**
   * 懒加载组件节点
   *
   * @private
   */
  protected _childVNode: Element | undefined
  // 暂停计数器
  protected suspenseCounter: Ref<number> | undefined = undefined
  // 标记是否需要更新
  private toBeUpdated: boolean = false

  constructor(props: LazyWidgetProps<T>) {
    if (typeof props.children !== 'function') {
      throw new TypeError(
        `[Vitarx.LazyWidget]：children期望得到一个异步函数，给定${typeof props.children}`
      )
    }
    super(props)
    if (props.loading && isVNode(props.loading)) {
      this._childVNode = props.loading
    } else {
      this.suspenseCounter = getSuspenseCounter(this)
      // 如果有上级暂停计数器则让计数器+1
      if (this.suspenseCounter) this.suspenseCounter.value++
    }
    if (props.onError) {
      if (typeof props.onError !== 'function') {
        Logger.warn(`onError属性期望得到一个回调函数，给定${typeof props.onError}`)
      } else {
        this.onError = props.onError
      }
    }
    this.load().then()
  }

  /**
   * 更新子节点
   *
   * @param vnode
   * @protected
   */
  protected updateChildVNode(vnode: Element) {
    this._childVNode = vnode
    if (this.suspenseCounter) {
      this.suspenseCounter.value--
    }
    // 如果还未挂载状态则标记待更新
    if (this.renderer.state === 'notMounted') {
      this.toBeUpdated = true
    } else if (this.renderer.state === 'activated') {
      this.update()
    }
  }

  /**
   * 组件挂载完毕之后开始加载异步组件
   *
   * @protected
   */
  protected async load(): Promise<void> {
    try {
      const { default: widget } = await this.children()
      this.updateChildVNode(
        isRecordObject(this.props.injectProps)
          ? createVNode(widget, this.props.injectProps)
          : createVNode(widget)
      )
    } catch (e) {
      if ('onError' in this) {
        const el = this.onError!(e, 'build')
        if (isVNode(el)) {
          return this.updateChildVNode(el)
        }
      }
      throw e
    }
  }

  protected override onMounted() {
    if (this.toBeUpdated) this.update()
  }

  protected build(): Element {
    return this._childVNode || createVNode(Fragment)
  }
}
