import {
  type IntrinsicAttributes,
  isVNode,
  type VElement,
  VElementToHTMLElement,
  type VNode
} from './VNode.js'
import { LifeCycle } from './life-cycle.js'
import { createElement, type ElementNode } from './renderer.js'
import { isConstructor, isFunction } from '../../utils/index.js'
import { watchDepend } from '../observer/index.js'

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
  private readonly _props: P
  private _element?: WidgetElement
  /**
   * ## 实例化
   *
   * @param props
   */
  constructor(props: P) {
    super()
    this._props = props
    this.onCreated?.()
  }

  /**
   * 判断是否已经挂载
   */
  get isMounted(): boolean {
    return this._element !== undefined && this._element.el !== null
  }
  /**
   * 外部传入的属性
   */
  get props(): DeepReadonly<P> {
    return this._props as DeepReadonly<P>
  }

  /**
   * 子节点
   */
  get children(): WidgetChildren<P> {
    return this.props.children as WidgetChildren<P>
  }

  /**
   * 如果组件已经挂载，则返回对应的元素，否则返回`null`。
   */
  get el(): VElement | null {
    return this.createElement().el
  }

  /**
   * 该方法由`Vitarx`内部调用，用于创建DOM元素
   *
   * 请勿在外部调用，以及使用`WidgetElement`实例方法，避免内存泄露。
   *
   * @protected
   */
  createElement(): WidgetElement {
    if (!this._element) this._element = new WidgetElement(this)
    return this._element
  }

  /**
   * 返回一个 `VNode` 节点，用于描述`UI`结构。
   *
   * 该方法应由子类实现，但该方法是受保护的，以便在`Vitarx`内部使用。
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
  if (!isConstructor(val)) return false
  return val.prototype instanceof Widget
}
/**
 * 小部件元素管理器
 */
class WidgetElement {
  currentVNode: VNode

  constructor(protected widget: Widget) {
    const { result, listener } = watchDepend(
      this.build.bind(this),
      () => {
        console.log(this.build())
        console.log('监听到依赖变化，对比新旧node差异')
      },
      { getResult: true }
    )
    if (!isVNode(result)) {
      listener?.destroy()
      throw new Error('[Vitarx]：Widget.build方法必须返回VNode虚拟节点')
    }
    this.currentVNode = result
  }

  /**
   * 获取元素节点
   */
  get el(): VElement | null {
    return this.currentVNode.el
  }

  /**
   * 挂载节点
   *
   * @param parent
   */
  mount(parent?: ElementNode) {
    let el: ElementNode
    if (this.currentVNode.el) {
      el = VElementToHTMLElement(this.currentVNode.el)
    } else {
      el = createElement(this.currentVNode, parent)
      this.widget.onMounted?.()
    }
    return el
  }

  private build(): VNode {
    try {
      return this.widget.build()
    } catch (e) {
      if (this.widget?.onError && isFunction(this.widget.onError)) {
        const vnode = this.widget.onError(e)
        if (isVNode(vnode)) return vnode
      }
      // 继续向上抛出异常
      throw e
    }
  }
}



