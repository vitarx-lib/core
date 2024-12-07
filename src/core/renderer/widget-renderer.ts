import { __updateParentVNode, isVNode, type VNode } from '../vnode/index.js'
import {
  type ContainerElement,
  getElParentNode,
  patchUpdate,
  removeElement,
  renderElement,
  replaceElement,
  unmountVNode,
  updateActivateState
} from './web-runtime-dom/index.js'
import { LifeCycleHooks, Widget, type WidgetType } from '../widget/index.js'
import { getCurrentScope, Scope } from '../scope/index.js'
import { watchDepend } from '../observer/index.js'
import { __LifeCycleTrigger__, __WidgetPropsSelfNodeSymbol__ } from '../widget/constant.js'

/**
 * 渲染状态
 *
 * - notRendered：未渲染
 * - notMounted：未挂载
 * - activated：活跃
 * - deactivate：不活跃
 * - uninstalling：卸载中
 * - unloaded：已卸载
 */
export type RenderState =
  | 'notRendered'
  | 'notMounted'
  | 'activated'
  | 'deactivate'
  | 'uninstalling'
  | 'unloaded'

/**
 * 小部件渲染器
 *
 * 用于渲染小部件，和管理小部件的生命周期。
 */
export class WidgetRenderer<T extends Widget> {
  constructor(widget: T) {
    this._widget = widget
    this._scope = getCurrentScope()!
    const { result: childVNode } = watchDepend(this.build.bind(this), this.update.bind(this), {
      getResult: true
    })
    this._child = childVNode
    // @ts-ignore 如果是开发模式，则触发onCreated生命周期
    if (import.meta.env?.MODE === 'development') {
      if (!this.vnode.el) {
        this.triggerLifeCycle(LifeCycleHooks.created)
      }
      return
    }
    // 触发onCreated生命周期
    this.triggerLifeCycle(LifeCycleHooks.created)
  }
  // 渲染器状态
  protected _state: RenderState = 'notRendered'
  // 等到更新
  protected _pendingUpdate = false
  // 影子占位元素
  protected _shadowElement: Comment | null = null
  // 当前组件的Child虚拟节点
  protected _child: VNode
  // 当前作用域
  protected _scope: Scope

  /**
   * 获取影子元素
   *
   * 仅传送节点和被挂起的顶层节点使用影子节点记录其所在位置。
   */
  get shadowElement(): Comment {
    if (!this._shadowElement) {
      this._shadowElement = document.createComment('')
    }
    return this._shadowElement
  }

  // 小部件实例
  protected _widget: T

  /**
   * 当前小部件的`child`虚拟节点
   *
   * @returns {VNode}
   */
  get child(): VNode {
    return this._child
  }

  // 传送功能相关数据
  protected _teleport: Element | null = null

  /**
   * 当前小部件的状态
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
   * @returns {ContainerElement | null}
   */
  get el(): ContainerElement | null {
    return this._child?.el || null
  }

  /**
   * 获取挂载的父节点
   *
   * 如果已卸载销毁或还未挂载过，则回返回null
   *
   * @returns {ParentNode | null} DOM元素实例
   */
  get parentEl(): ParentNode | null {
    return getElParentNode(this.el)
  }

  /**
   * 获取小部件自身的虚拟节点
   *
   * @returns {VNode}
   */
  get vnode(): VNode<WidgetType> {
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
  protected get widget(): T {
    return this._widget
  }

  /**
   * 判断节点是否需要传送
   *
   * 该属性需在渲染之后调用获取的结果才准确！！
   */
  get teleport(): null | Element {
    return this._teleport
  }

  /**
   * 渲染小部件，并返回渲染的真实元素
   *
   * 该方法仅触发 `beforeMount`生命周期，但不会触发`mounted`生命周期，需额外调用`mount`方法触发`mounted`生命周期。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @param {ContainerElement} container - 容器元素，如果`beforeMount`钩子返回了指定的容器元素，则此参数无效。
   * @returns {ContainerElement} - 渲染的元素实例
   * @protected
   */
  render(container?: ContainerElement): ContainerElement {
    if (this.el) throw new Error('[Vitarx.WidgetRenderer.render]：组件已渲染，请勿重复渲染！')
    let el: ContainerElement | null = null
    try {
      // 触发onBeforeMount生命周期
      const target = this.triggerLifeCycle(LifeCycleHooks.beforeMount)
      if (target instanceof Element) {
        // 如果指定了父元素，则不继续往下传递父元素，避免提前展示视图
        this._teleport = target
        // 将占位符节点插入到正常的父容器中
        container?.appendChild(this.shadowElement)
        el = renderElement(this.child) as ContainerElement
      } else {
        el = renderElement(this.child, container) as ContainerElement
      }
    } catch (e) {
      // 触发onError生命周期
      const errVNode = this.triggerLifeCycle(LifeCycleHooks.error, e, 'render')
      // 如果返回的内容不是一个VNode虚拟节点，则继续抛出错误
      if (!isVNode(errVNode)) throw e
      this._child = errVNode
      el = renderElement(this.child) as ContainerElement
    }
    this._state = 'notMounted'
    return el
  }

  /**
   * 更新视图
   *
   * @param {VNode} newChildVNode - 新子节点，没有则使用`build`方法构建。
   */
  update(newChildVNode?: VNode): void {
    if (this.state === 'unloaded') {
      return console.warn('[Vitarx.WidgetRenderer.update]：渲染器已销毁，不能再更新视图！')
    }
    if (this._pendingUpdate || this.state === 'notRendered') return
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
      this._child = this.patchUpdate(oldVNode, newVNode)
      // 触发更新后生命周期
      this.triggerLifeCycle(LifeCycleHooks.updated)
    } catch (e) {
      this._pendingUpdate = false
      console.error('[Vitarx.WidgetRenderer.update]：更新视图时捕获到了异常', e)
    }
  }

  /**
   * 差异更新
   *
   * @param {VNode} oldVNode - 旧子节点
   * @param {VNode} newVNode - 新子节点
   * @protected
   */
  protected patchUpdate(oldVNode: VNode, newVNode: VNode): VNode {
    return patchUpdate(oldVNode, newVNode)
  }

  /**
   * 该方法用于在元素真实挂载到文档中时调用。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @protected
   */
  mount(): void {
    if (this.state !== 'notMounted') {
      return console.warn('[Vitarx.WidgetRenderer.mount]：非待挂载状态，不能进行挂载！')
    }
    // 挂载到传送节点上
    if (this.teleport) {
      this.teleport.appendChild(this.el!)
    }
    this._state = 'activated'
    // 触发onMounted生命周期
    this.triggerLifeCycle(LifeCycleHooks.mounted)
    // 触发onActivated生命周期
    this.triggerLifeCycle(LifeCycleHooks.activated)
  }

  /**
   * 卸载小部件
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @param {boolean} root - 用于递归时判断是否需要移除当前元素，内部逻辑使用，请勿外部传入。
   * @protected
   */
  unmount(root: boolean = true): void {
    if (this.state !== 'uninstalling' && this.state !== 'unloaded') {
      this._state = 'uninstalling'
      // 触发onDeactivated生命周期
      const result = this.triggerLifeCycle(LifeCycleHooks.beforeUnmount, root)
      // 递归卸载子节点
      unmountVNode(this.child, root && result !== true)
      // 销毁当前作用域
      this.scope?.destroy()
      // 移除占位元素
      this._shadowElement?.remove()
      // 修改状态为已卸载
      this._state = 'unloaded'
      // 触发onDeactivated生命周期
      this.triggerLifeCycle(LifeCycleHooks.deactivate)
      // 触发onUnmounted生命周期
      this.triggerLifeCycle(LifeCycleHooks.unmounted)
      // 释放内存
      // @ts-ignore
      this._child = null
      // @ts-ignore
      this._scope = null
      // @ts-ignore
      this._widget = null
      this._shadowElement = null
      this._teleport = null
    }
  }

  /**
   * 让小部件恢复激活状态，重新挂载到父元素上。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @param {boolean} root - 该参数用于递归时内部判断是否需要重新挂载，请勿外部传入。
   * @protected
   */
  activate(root: boolean = true): void {
    if (this._state === 'deactivate') {
      this._state = 'activated'
      // 激活子节点
      updateActivateState(this.child, true)
      if (this.teleport) {
        // 复原传送节点元素
        this.teleport.appendChild(this.el!)
      } else if (root) {
        // 使用真实元素替换占位元素
        replaceElement(this.el!, this.shadowElement)
      }
      // 恢复作用域
      this._scope?.unpause()
      // 触发onActivated生命周期
      this.triggerLifeCycle(LifeCycleHooks.activated)
    }
  }

  /**
   * 停用小部件
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @param root - 该参数用于递归时内部判断是否需要移除当前元素，请勿外部传入。
   * @protected
   */
  deactivate(root: boolean = true): void {
    if (this._state === 'activated') {
      this._state = 'deactivate'
      this._scope?.pause()
      // 递归停用子节点
      updateActivateState(this.child, false)
      // 触发onDeactivated生命周期
      this.triggerLifeCycle(LifeCycleHooks.deactivate)
      // 如果是传送节点则删除元素
      if (this.teleport) {
        removeElement(this.el!)
      } else if (root) {
        replaceElement(this.shadowElement, this.el!)
      }
    }
  }

  /**
   * 构建`child`虚拟节点
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @protected
   * @returns {VNode}
   */
  protected build(): VNode {
    let vnode: VNode
    try {
      vnode = (this.widget as any).build()
    } catch (e) {
      const errVNode = this.triggerLifeCycle(LifeCycleHooks.error, e, 'build')
      if (!isVNode(errVNode)) throw e
      vnode = errVNode
    }
    if (isVNode(vnode)) {
      __updateParentVNode(vnode, this.vnode)
      return vnode
    }
    throw new Error(`[Vitarx.WidgetRenderer]：${this.name}.build返回值必须是VNode对象`)
  }

  /**
   * 触发生命周期钩子
   *
   * @param hook - 生命周期钩子名称
   * @param args - 参数列表
   * @protected
   */
  protected triggerLifeCycle(hook: LifeCycleHooks, ...args: any[]): any {
    return (this.widget as any)[__LifeCycleTrigger__](hook, ...args)
  }
}
