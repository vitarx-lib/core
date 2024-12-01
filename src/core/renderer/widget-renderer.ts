import { __updateParentVNode, isVNode, type VElement, type VNode } from '../vnode/index.js'
import {
  getVElementParentEl,
  type HtmlElement,
  patchUpdate,
  removeElement,
  renderElement,
  replaceElement,
  unmountVNode,
  updateActivateState,
  VElementToHTMLElement
} from './web-runtime-dom/index.js'
import {
  type ClassWidgetConstructor,
  type FnWidgetConstructor,
  LifeCycleHooks,
  Widget
} from '../widget/index.js'
import { getCurrentScope, Scope } from '../scope/index.js'
import { watchDepend } from '../observer/index.js'
import { __LifeCycleTrigger__, __WidgetPropsSelfNodeSymbol__ } from '../widget/constant.js'

/**
 * 渲染状态
 *
 * - notMounted：未挂载
 * - activated：活跃
 * - deactivate：不活跃
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
  // 小部件实例
  protected _widget: Widget
  // 渲染器状态
  protected _state: RenderState = 'notMounted'
  // 等到更新
  protected _pendingUpdate = false
  // 占位节点，仅在停用时才会记录
  protected _placeholderEl: Text | null = null
  // 当前组件的Child虚拟节点
  protected _child: VNode
  // 当前作用域
  protected _scope: Scope

  constructor(widget: Widget) {
    this._widget = widget
    this._scope = getCurrentScope()!
    const { result: childVNode } = watchDepend(this.build.bind(this), this.update.bind(this), {
      getResult: true
    })
    this._child = childVNode
  }

  /**
   * 当前小部件的`child`虚拟节点
   *
   * @returns {VNode}
   */
  get child(): VNode {
    return this._child
  }

  /**
   * 获取当前状态
   */
  get state(): RenderState {
    return this._state
  }

  /**
   * 当前作用域
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  get scope(): Scope | undefined {
    return this._scope
  }

  /**
   * 当前小部件的child虚拟节点元素
   *
   * @returns {VElement | null}
   */
  get el(): VElement | null {
    return this._child.el || null
  }

  /**
   * 获取挂载的父节点
   *
   * 如果已卸载销毁或还未挂载过，则回返回null
   *
   * @returns {ParentNode | null} DOM元素实例
   */
  get parentEl(): ParentNode | null {
    return getVElementParentEl(this.el)
  }

  /**
   * 获取小部件自身的虚拟节点
   *
   * @returns {VNode}
   */
  get vnode(): VNode<FnWidgetConstructor | ClassWidgetConstructor> {
    return (this.widget as any).props[__WidgetPropsSelfNodeSymbol__]
  }

  /**
   * 获取小部件名称
   *
   * @returns {string}
   */
  get name(): string {
    return this.vnode.type.name
  }

  /**
   * 小部件实例
   *
   * @returns {Widget}
   */
  protected get widget(): Widget {
    return this._widget
  }

  /**
   * 挂载节点
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   * @param parent - 父元素
   */
  mount(parent?: Element | DocumentFragment): HtmlElement {
    let el: HtmlElement
    if (this.state !== 'notMounted') {
      if (!this.el) {
        throw new Error('[Vitarx.WidgetRenderer]：渲染器实例已被销毁，不能重新进行挂载。')
      }
      el = VElementToHTMLElement(this.el)
      if (parent && parent !== this.parentEl) {
        console.warn(
          '[Vitarx.WidgetRenderer]：同一个小部件实例不应该被多次挂载，这会从旧的容器，转移到新的容器。'
        )
        parent.appendChild(el)
      }
    } else {
      // 触发onCreated生命周期
      this.triggerLifeCycle(LifeCycleHooks.created)
      // 触发onBeforeMount生命周期
      const target = this.triggerLifeCycle(LifeCycleHooks.beforeMount)
      // 挂载到指定元素
      if (target instanceof Element) parent = target
      el = renderElement(this._child, parent)
      this._state = 'activated'
      Promise.resolve().then(() => {
        // 触发onMounted生命周期
        this.triggerLifeCycle(LifeCycleHooks.mounted)
        // 触发onActivated生命周期
        this.triggerLifeCycle(LifeCycleHooks.activated)
      })
    }
    return el
  }

  /**
   * 更新视图
   *
   * @param {VNode} newChildVNode - 可选的新`child`虚拟节点，如果不提供，则使用`build`方法构建。
   */
  update(newChildVNode?: VNode): void {
    if (this._state === 'unloaded') {
      console.warn('[Vitarx]：渲染器已销毁，无法再更新视图！')
      return
    }
    if (this._pendingUpdate) return
    this._pendingUpdate = true
    try {
      // 触发更新前生命周期
      this.triggerLifeCycle(LifeCycleHooks.beforeUpdate)
      // 延迟更新
      setTimeout(() => {
        this._pendingUpdate = false
      })
      const oldVNode = this._child
      const newVNode = newChildVNode || this.build()
      this._child = patchUpdate(oldVNode, newVNode)
      // 触发更新后生命周期
      this.triggerLifeCycle(LifeCycleHooks.updated)
    } catch (e) {
      this._pendingUpdate = false
      console.trace(`[Vitarx.WidgetRenderer.update]：更新视图时捕获到了异常，${e}`)
    }
  }
  /**
   * 卸载小部件
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @param {boolean} root - 用于递归时判断是否需要移除当前元素，内部逻辑使用，请勿外部传入。
   * @protected
   */
  unmount(root: boolean = true): void {
    if (this._state === 'activated' || this._state === 'deactivate') {
      this._state = 'uninstalling'
      // 触发onDeactivated生命周期
      const result = this.triggerLifeCycle(LifeCycleHooks.beforeUnmount, root)
      // 递归卸载子节点
      unmountVNode(this.child, false)
      // 如果没有返回true，则等待子节点删除完成然后移除当前节点
      if (result !== true) removeElement(this.el)
      // 销毁当前作用域
      this.scope?.destroy()
      // 修改状态为已卸载
      this._state = 'unloaded'
      // 触发onUnmounted生命周期
      this.triggerLifeCycle(LifeCycleHooks.unmounted)
      // @ts-ignore 释放资源
      this._child = null
      // @ts-ignore 释放资源
      this._scope = null
      // @ts-ignore 释放资源
      this._widget = null
      // 如果有占位节点则删除占位节点
      if (this._placeholderEl) {
        this._placeholderEl.remove()
        this._placeholderEl = null
      }
    }
  }

  /**
   * 让小部件恢复激活状态，重新挂载到父元素上。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @param {boolean} root - 该参数用于递归时内部判断是否需要重新挂载，请勿外部传入。
   * @protected
   */
  activate(root: boolean = true): void {
    if (this._state === 'deactivate') {
      this._state = 'activated'
      if (root) {
        // 使用真实节点替换占位节点
        replaceElement(this.el!, this._placeholderEl!, this._placeholderEl!.parentNode!)
        this._placeholderEl = null
      }
      // 恢复作用域
      this._scope?.unpause()
      // 触发onActivated生命周期
      this.triggerLifeCycle(LifeCycleHooks.activated)
      // 激活子节点
      updateActivateState(this.child, true)
    }
  }

  /**
   * 停用小部件
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @param root - 该参数用于递归时内部判断是否需要移除当前元素，请勿外部传入。
   * @protected
   */
  deactivate(root: boolean = true): void {
    if (this._state === 'activated') {
      this._state = 'deactivate'
      this._scope?.pause()
      // 触发onDeactivated生命周期
      this.triggerLifeCycle(LifeCycleHooks.deactivate)
      // 删除当前元素
      if (root) {
        // 创建一个空文本节点用于记录位置
        this._placeholderEl = document.createTextNode('')
        // 使用占位节点替换真实节点
        replaceElement(this._placeholderEl!, this.el, this.parentEl!)
      }
      // 停用子节点
      updateActivateState(this.child, false)
    }
  }

  /**
   * 构建`child`虚拟节点
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   * @returns {VNode}
   */
  protected build(): VNode {
    let vnode: VNode
    try {
      vnode = (this.widget as any).build()
    } catch (e) {
      const errVNode = this.triggerLifeCycle(LifeCycleHooks.error)
      if (!isVNode(errVNode)) throw e
      vnode = errVNode
    }
    if (isVNode(vnode)) {
      __updateParentVNode(vnode, this.vnode)
      return vnode
    }
    throw new Error(`[Vitarx.WidgetRenderer]：${this.name}，Widget.build返回值必须是VNode对象`)
  }

  /**
   * 触发生命周期钩子
   *
   * @param hook - 生命周期钩子名称
   * @param args - 参数列表
   *
   * @protected
   */
  protected triggerLifeCycle(hook: LifeCycleHooks, ...args: any[]): any {
    return (this.widget as any)[__LifeCycleTrigger__](hook, ...args)
  }
}


