import type { WidgetType } from '../constant.js'
import { type Element, Widget } from '../widget.js'
import { createVNode, Fragment, isVNode } from '../../vnode/index.js'
import { getSuspenseCounter } from './Suspense.js'
import type { Ref } from '../../variable/index.js'
import type { ErrorInfo } from '../life-cycle.js'

/**
 * 惰性加载器
 */
type LazyLoader<T extends WidgetType> = () => Promise<{ default: T }>

/**
 * onError生命周期钩子
 *
 * @param {unknown} error - 捕获到的异常，通常是Error对象，也有可能是子组件抛出的其他异常
 * @param {ErrorInfo} info - 捕获异常的阶段，可以是`build`或`render`
 * @returns {void|Element} - 可以返回一个`Element`虚拟节点，做为后备内容展示。
 */
type OnErrorCallback<T extends WidgetType> = (this: LazyWidget<T>, error: unknown, info: ErrorInfo) => void | Element

/**
 * 惰性加载组件Props
 */
interface LazyWidgetProps<T extends WidgetType> {
  /**
   * 接收一个惰性加载器
   *
   * @example
   * // 模块必须存在`export default`导出，否则会报错。
   * ()=>import('./YourWidget.js')
   */
  children: LazyLoader<T>
  /**
   * 加载成功之前要显示的组件
   */
  loading?: Element
  /**
   * 异常处理钩子
   */
  onError?: OnErrorCallback<T>
}

/**
 * 惰性加载小部件
 *
 * `children`传入的小部件会被异步加载，加载完成过后自动渲染到视图中。
 *
 * @example
 * ```jsx
 * // 通过属性传入
 * <LazyWidget children={() => import('./YourWidget.ts')} />
 * // 通过插槽传入
 * <LazyWidget>{() => import('./YourWidget.js')}</LazyWidget>
 * // 自定义loading态备用小部件
 * <LazyWidget loading={<div>加载中...</div>}/>
 * // 自定义error态备用小部件
 * <LazyWidget error={<div>加载失败...</div>}/>
 * ```
 *
 */
export default class LazyWidget<T extends WidgetType> extends Widget<LazyWidgetProps<T>> {
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
        console.warn(
          `[Vitarx.LazyWidget]：onError属性期望得到一个回调函数，给定${typeof props.onError}`
        )
      } else {
        this.onError = props.onError
      }
    }
    // noinspection JSIgnoredPromiseFromCall
    this.load()
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
    } else {
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
      this.updateChildVNode(createVNode(widget))
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
