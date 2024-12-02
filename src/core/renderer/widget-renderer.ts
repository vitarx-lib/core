import { __updateParentVNode, isVNode, type VNode } from '../vnode/index.js'
import {
  type ContainerElement,
  getVElementParentNode,
  patchUpdate,
  removeElement,
  renderElement,
  replaceElement,
  unmountVNode,
  updateActivateState,
  type VElement
} from './web-runtime-dom/index.js'
import { LifeCycleHooks, Widget, type WidgetType } from '../widget/index.js'
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
type Teleport = {
  to: Element
  placeholder: Text
}
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
  // 传送功能相关数据
  protected _teleport: Teleport | null = null
  constructor(widget: Widget) {
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

  /**
   * 当前小部件的`child`虚拟节点
   *
   * @returns {VNode}
   */
  get child(): VNode {
    return this._child
  }

  /**
   * 判断节点是否需要传送
   *
   * 该属性需在渲染之后调用获取的结果才准确！！
   */
  get teleport(): null | Teleport {
    return this._teleport
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
    return getVElementParentNode(this.el)
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
  protected get widget(): Widget {
    return this._widget
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
    if (this.el) throw new Error('[Vitarx.WidgetRenderer.container]：组件已渲染，请勿重复渲染！')
    // 触发onBeforeMount生命周期
    const target = this.triggerLifeCycle(LifeCycleHooks.beforeMount)
    if (target instanceof Element) {
      // 如果指定了父元素，则不继续往下传递父元素，避免提前展示视图
      this._teleport = {
        to: target,
        placeholder: document.createTextNode('')
      }
      // 将占位符节点插入到正常的父容器中
      container?.appendChild(this._teleport.placeholder)
      return renderElement(this.child) as ContainerElement
    } else {
      return renderElement(this.child, container) as ContainerElement
    }
  }

  /**
   * 该方法用于在元素真实挂载到文档中时调用。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @protected
   */
  mount(): void {
    if (this.state !== 'notMounted') {
      throw new Error('[Vitarx.WidgetRenderer.mount]：不能对组件进行重复的挂载操作!')
    }
    if (!this.el) {
      throw new Error('[Vitarx.WidgetRenderer.mount]：组件没有渲染，请先调用render方法渲染组件！')
    }
    // 挂载到传送节点上
    if (this.teleport) {
      this.teleport.to.appendChild(this.el)
    }
    this._state = 'activated'
    // 触发onMounted生命周期
    this.triggerLifeCycle(LifeCycleHooks.mounted)
    // 触发onActivated生命周期
    this.triggerLifeCycle(LifeCycleHooks.activated)
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
      console.error('[Vitarx.WidgetRenderer.update]：更新视图时捕获到了异常', e)
    }
  }

  /**
   * 卸载小部件
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
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
      // 移除占位元素
      this._placeholderEl?.remove()
      this.teleport?.placeholder.remove()
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
      this._placeholderEl = null
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
        replaceElement(this._placeholderEl!, this.el!, this.parentEl!)
      }
      // 停用子节点
      updateActivateState(this.child, false)
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
   * @protected
   */
  protected triggerLifeCycle(hook: LifeCycleHooks, ...args: any[]): any {
    return (this.widget as any)[__LifeCycleTrigger__](hook, ...args)
  }
}


