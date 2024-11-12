import { isVNode, type VElement, type VNode } from './VNode.js'
import { isFunction } from '../../utils/index.js'
import { watchDepend } from '../../index.js'
import type { Widget } from './widget.js'
import {
  getParentNode,
  type HtmlElement,
  patchUpdate,
  renderElement,
  VElementToHTMLElement
} from './web-render/index.js'

/**
 * 小部件渲染器
 *
 * 用于渲染小部件，和管理小部件的生命周期。
 */
export class WidgetRenderer {
  // 当前组件的Child虚拟节点
  currentChildVNode: VNode
  // 等到更新
  #pendingUpdate = false

  constructor(protected widget: Widget) {
    const { result, listener } = watchDepend(this.build.bind(this), this.update.bind(this), {
      getResult: true
    })
    if (!isVNode(result)) {
      listener?.destroy()
      throw new Error('[Vitarx]：Widget.build方法必须返回VNode虚拟节点')
    }
    this.currentChildVNode = result
  }

  /**
   * 判断是否已挂载到DOM上
   *
   * 如果组件被临时停用，也会返回false
   *
   * @returns {boolean}
   */
  get mounted(): boolean {
    return this.container !== null
  }

  /**
   * 当前小部件的child虚拟节点元素
   *
   * @returns {VElement | null}
   */
  get el(): VElement | null {
    return this.currentChildVNode.el
  }

  /**
   * 获取挂载的父元素
   *
   * @returns {ParentNode | null}
   */
  get container(): ParentNode | null {
    return getParentNode(this.el)
  }

  /**
   * 当前小部件的`child`虚拟节点
   *
   * @returns {VNode}
   */
  get child(): VNode {
    return this.currentChildVNode
  }

  /**
   * 创建节点元素
   *
   * @returns {HtmlElement}
   */
  createElement(): HtmlElement {
    return renderElement(this.currentChildVNode)
  }

  /**
   * 挂载节点
   *
   * @param parent
   */
  mount(parent?: Element | DocumentFragment): HtmlElement {
    let el: HtmlElement
    if (this.el) {
      el = VElementToHTMLElement(this.el)
    } else {
      el = this.createElement()
      // 触发onActivated生命周期
      this.widget.onActivated?.()
      // 触发onMounted生命周期
      this.widget.onMounted?.()
    }
    // 挂载到父元素
    parent?.appendChild(el)
    return el
  }

  /**
   * 构建`child`虚拟节点
   *
   * @returns {VNode}
   */
  build(): VNode {
    let vnode: VNode
    try {
      vnode = this.widget.build() as VNode
    } catch (e) {
      if (this.widget?.onError && isFunction(this.widget.onError)) {
        vnode = this.widget.onError(e) as VNode
        if (isVNode(vnode)) return vnode
      }
      // 继续向上抛出异常
      throw e
    }
    if (isVNode(vnode)) return vnode
    throw new Error('[Vitarx]：Widget.build方法必须返回有效的VNode')
  }

  /**
   * 更新视图
   */
  update(): void {
    if (this.#pendingUpdate) return
    this.#pendingUpdate = true
    try {
      this.widget.onBeforeUpdate?.()
      setTimeout(() => {
        this.#pendingUpdate = false
      })
      const oldVNode = this.currentChildVNode
      const newVNode = this.build()
      this.currentChildVNode = patchUpdate(oldVNode, newVNode)
      this.widget.onUpdated?.()
    } catch (e) {
      this.#pendingUpdate = false
      console.trace(`[Vitarx]：更新视图时捕获到了异常，${e}`)
    }
  }
}
