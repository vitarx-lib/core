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
  updateActivateState,
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
export type RenderState = 'notMounted' | 'activated' | 'deactivate' | 'uninstalling' | 'unloaded'
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
  /**
   * 渲染器状态
   *
   * @protected
   */
  protected state: RenderState = 'notMounted'
  // 上一次挂载的父元素
  #lastParent: ParentNode | null = null
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
   * 当前作用域
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
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
   * 获取挂载的父节点
   *
   * @returns {ParentNode | null} DOM元素实例
   */
  get parent(): ParentNode | null {
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
   * 获取当前状态
   */
  get currentState(): RenderState {
    return this.state
  }
  /**
   * 挂载节点
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   * @param parent
   */
  mount(parent?: Element | DocumentFragment): HtmlElement {
    let el: HtmlElement
    if (this.el) {
      el = VElementToHTMLElement(this.el)
      if (parent) {
        console.warn('[Vitarx]：同一个小部件实例不应该被多次挂载，这会从旧的容器，转移到新的容器。')
        parent.appendChild(el)
      }
    } else {
      // 触发onBeforeMount生命周期
      const target = this.widget.onBeforeMount?.()
      // 挂载到指定元素
      if (target instanceof Element) parent = target
      el = renderElement(this.#currentVNode, parent)
      Promise.resolve().then(() => {
        this.state = 'activated'
        // 触发onActivated生命周期
        this.widget.onActivated?.()
        // 触发onMounted生命周期
        this.widget.onMounted?.()
      })
    }
    return el
  }

  /**
   * 构建`child`虚拟节点
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
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
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  unmount() {
    if (this.state === 'activated' || this.state === 'deactivate') {
      this.state = 'uninstalling'
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
      // 修改状态为已卸载
      this.state = 'unloaded'
      // 触发onUnmounted生命周期
      this.widget.onUnmounted?.()
      // @ts-ignore 释放资源
      this.#currentVNode = null
      this.#currentScope = undefined
      // @ts-ignore 释放资源
      this.widget = undefined
      this.#lastParent = null
    }
  }

  /**
   * 让小部件恢复激活状态，重新挂载到父元素上。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   * @param root - 该参数用于递归时内部判断是否需要重新挂载，请勿外部传入。
   */
  activate(root: boolean = true): void {
    if (this.state === 'deactivate') {
      this.state = 'activated'
      if (root) {
        // 恢复父元素
        this.#lastParent?.appendChild(VElementToHTMLElement(this.el!))
        this.#lastParent = null
      }
      // 恢复作用域
      this.#currentScope?.unpause()
      // 触发onActivated生命周期
      this.widget.onActivated?.()
      // 恢复子节点
      updateActivateState(this.child, true)
    }
  }

  /**
   * 停用小部件
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   * @param root - 该参数用于递归时内部判断是否需要移除当前元素，请勿外部传入。
   */
  deactivate(root: boolean = true): void {
    if (this.state === 'activated') {
      this.state = 'deactivate'
      this.#currentScope?.pause()
      // 触发onDeactivated生命周期
      this.widget.onDeactivate?.()
      // 删除当前元素
      if (root) {
        this.#lastParent = this.parent
        removeElement(this.el)
      }
      // 停用子节点
      updateActivateState(this.child, false)
    }
  }
}


