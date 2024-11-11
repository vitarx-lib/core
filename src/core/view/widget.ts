import { type IntrinsicAttributes, type VElement, type VNode } from './VNode.js'
import { LifeCycle } from './life-cycle.js'
import { WidgetRenderer } from './renderer.js'

/**
 * 类组件构造器类型
 */
export type ClassWidget<P extends Record<string, any> = {}> = new (props: P & IntrinsicAttributes) => Widget<P>
// 获取组件子节点
export type WidgetChildren<P> = P extends { children: infer U }
  ? U
  : P extends {
        children?: infer U
      }
    ? U | undefined
    : undefined

/**
 * 组件基类
 */
export abstract class Widget<P extends Record<string, any> = {}> extends LifeCycle {
  readonly #props: P
  #renderer?: WidgetRenderer
  /**
   * ## 实例化
   *
   * @param props
   */
  protected constructor(props: P) {
    super()
    this.#props = props
    this.onCreated?.()
  }

  /**
   * 该方法由`Vitarx`内部调用，用于渲染
   *
   * 请勿在外部调用，以及使用`WidgetRenderer`实例方法，避免内存泄露。
   *
   * @protected
   */
  get renderer(): WidgetRenderer {
    if (!this.#renderer) {
      this.#renderer = new WidgetRenderer(this)
    }
    return this.#renderer
  }
  /**
   * 外部传入的属性
   */
  get props(): DeepReadonly<P> {
    return this.#props as DeepReadonly<P>
  }

  /**
   * 获取外部传入的子节点
   *
   * `children` 不会自动渲染，你可以将它视为一个参数，你可以在`build`方法中使用该参数，来实现插槽的效果。
   */
  get children(): WidgetChildren<P> {
    return this.props.children as WidgetChildren<P>
  }

  /**
   * 判断是否已经挂载
   */
  get isMounted(): boolean {
    return !!this.#renderer?.mounted
  }

  /**
   * 获取小部件的`DOM`元素
   *
   * 如果小部件已经渲染，则返回小部件的`DOM`元素，否则返回`null`。
   *
   * @returns {VElement | null}
   */
  get el(): VElement | null {
    return this.renderer.el
  }

  /**
   * 返回一个 `VNode` 节点，用于描述`UI`结构。
   *
   * @note 该方法应由子类实现，且该方法是受保护的，仅供内部渲染逻辑使用。
   *
   * @protected
   * @returns {VNode}
   */
  abstract build(): VNode
}

/**
 * 判断是否为类构造器
 *
 * @param val
 */
export function isClassWidget(val: any): val is ClassWidget<any> {
  if (typeof val !== 'function') return false
  return val.prototype instanceof Widget
}
