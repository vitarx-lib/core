import { isVNode, VElementToHTMLElement, type VNode } from './VNode.js'
import { LifeCycle } from './life-cycle.js'
import { createElement, type ElementNode } from './renderer.js'
import { isFunction } from '../../utils/index.js'
import { watchDepend } from '../observer/index.js'

/**
 * 组件构造器
 */
export type WidgetConstructor<P extends Record<string, any>> = new (props: P) => Widget<P>
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

  get el(): ElementNode {
    return this.createElement().el
  }

  /**
   * 创建元素
   */
  protected createElement(): WidgetElement {
    if (!this._element) this._element = new WidgetElement(this)
    return this._element
  }

  /**
   * 返回一个 `VNode` 节点，用于描述`UI`结构。
   *
   * @returns {VNode}
   */
  protected abstract build(): VNode
}

class WidgetElement {
  currentVNode: VNode

  constructor(protected widget: Widget) {
    const { result, listener } = watchDepend(
      this.build,
      () => {
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
  get el(): ElementNode {
    if (this.currentVNode.el) {
      return VElementToHTMLElement(this.currentVNode.el)
    } else {
      return createElement(this.currentVNode)
    }
  }

  build(): VNode {
    try {
      // @ts-ignore
      return this.widget.build()
    } catch (e) {
      // @ts-ignore
      if (this.widget?.onError && isFunction(this.widget.onError)) {
        // @ts-ignore
        const vnode = this.widget.onError(e)
        if (isVNode(vnode)) return vnode
      }
      // 继续向上抛出异常
      throw e
    }
  }

  /**
   * 挂载节点
   *
   * @param el
   */
  mount(el: HTMLElement) {
    el.appendChild(this.el)
  }
}
