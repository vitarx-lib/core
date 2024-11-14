import { isVNode, type VElement, type VNode } from './VNode.js'
import { isFunction } from '../../utils/index.js'
import { getCurrentScope, Scope, watchDepend } from '../../index.js'
import type { Widget } from './widget.js'
import {
  getParentNode,
  type HtmlElement,
  patchUpdate,
  removeElement,
  renderElement,
  unmountVNode,
  VElementToHTMLElement
} from './web-render/index.js'

/**
 * 渲染状态
 *
 * - notMounted：未挂载
 * - mounted：已挂载
 * - uninstalling：卸载中
 * - unloaded：已卸载
 */
export type RenderState = 'notMounted' | 'mounted' | 'uninstalling' | 'unloaded'
/**
 * 小部件渲染器
 *
 * 用于渲染小部件，和管理小部件的生命周期。
 */
export class WidgetRenderer {
  // 当前组件的Child虚拟节点
  #currentVNode: VNode
  // 等到更新
  #pendingUpdate = false
  // 当前作用域
  #currentScope = getCurrentScope()
  // 是否已销毁
  #state: RenderState = 'notMounted'
  constructor(protected widget: Widget) {
    const { result, listener } = watchDepend(this.build.bind(this), this.update.bind(this), {
      getResult: true
    })
    if (!isVNode(result)) {
      listener?.destroy()
      throw new Error('[Vitarx]：Widget.build方法必须返回VNode虚拟节点')
    }
    this.#currentVNode = result
  }

  /**
   * 判断是否已初次挂载
   *
   * @returns {boolean}
   */
  get isMounted(): boolean {
    return this.#currentVNode.el !== null
  }

  /**
   * 获取当前状态
   *
   * @returns {RenderState}
   */
  get state(): RenderState {
    return this.#state
  }

  /**
   * 当前作用域
   */
  get scope(): Scope | undefined {
    return this.#currentScope
  }
  /**
   * 当前小部件的child虚拟节点元素
   *
   * @returns {VElement | null}
   */
  get el(): VElement | null {
    return this.#currentVNode.el || null
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
    return this.#currentVNode
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
      el = renderElement(this.#currentVNode)
      Promise.resolve().then(() => {
        this.#state = 'mounted'
        // 触发onActivated生命周期
        this.widget.onActivated?.()
        // 触发onMounted生命周期
        this.widget.onMounted?.()
      })
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
    if (this.state === 'unloaded') {
      console.warn('[Vitarx]：渲染器已销毁，无法再更新视图！')
      return
    }
    if (this.#pendingUpdate) return
    this.#pendingUpdate = true
    try {
      this.widget.onBeforeUpdate?.()
      setTimeout(() => {
        this.#pendingUpdate = false
      })
      const oldVNode = this.#currentVNode
      const newVNode = this.build()
      this.#currentVNode = patchUpdate(oldVNode, newVNode)
      this.widget.onUpdated?.()
    } catch (e) {
      this.#pendingUpdate = false
      console.trace(`[Vitarx]：更新视图时捕获到了异常，${e}`)
    }
  }

  /**
   * 卸载小部件
   */
  unmount() {
    if (this.state === 'mounted') {
      this.#state = 'uninstalling'
      // 触发onDeactivated生命周期
      const result = this.widget.onBeforeUnmount?.()
      // 递归删除子节点
      unmountVNode(this.child)
      // 等待子节点删除完成然后移除当前节点
      if (result !== true) {
        removeElement(this.el)
      }
      // 销毁当前作用域
      this.scope?.destroy()
      this.#state = 'unloaded'
      this.widget.onUnmounted?.()
      // @ts-ignore 释放资源
      this.#currentVNode = null
      this.#currentScope = undefined
      // @ts-ignore 释放资源
      this.widget = undefined
    }
  }
}
