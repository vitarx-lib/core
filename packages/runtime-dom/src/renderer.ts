import { depSubscribe, Subscriber } from '@vitarx/responsive'
import { App } from '../../../app'
import type {
  BaseRuntimeContainerElement,
  RuntimeElement,
  RuntimeNoTagElement
} from '../../../renderer/index'
import { createVNode } from '../../../vnode/core/creation'
import {
  addParentVNodeMapping,
  Fragment,
  isVNode,
  type VNode,
  type WidgetVNode
} from '../../../vnode/index'
import { LifecycleHooks } from '../constant'
import type { Widget } from '../widget'
import { triggerLifecycleHook } from './lifecycle'

/**
 * 渲染状态
 *
 * - notRendered：未渲染
 * - notMounted：未挂载
 * - activated：活跃
 * - deactivating：停用中
 * - deactivated：不活跃
 * - uninstalling：卸载中
 * - unloaded：已卸载
 */
export type WidgetState =
  | 'notRendered'
  | 'notMounted'
  | 'activated'
  | 'deactivating'
  | 'deactivated'
  | 'uninstalling'
  | 'unloaded'

export class WidgetRenderer<T extends Widget> {
  /**
   * 状态值
   *
   * @private
   */
  #state: WidgetState = 'notRendered'
  /**
   * 等待更新
   *
   * @private
   */
  #pendingUpdate = false
  /**
   * 影子占位元素
   *
   * @private
   */
  #shadowElement: RuntimeNoTagElement | null = null
  /**
   * 当前组件的Child虚拟节点
   *
   * @private
   */
  #child: VNode
  /**
   * 视图依赖订阅实例
   *
   * @private
   */
  #viewDepSubscriber: Subscriber | undefined
  /**
   * 小部件实例
   * @private
   */
  readonly #widget: T
  /**
   * 传送的目标元素
   *
   * @private
   */
  #teleport: Element | null = null

  constructor(widget: T) {
    this.#widget = widget
    this.#child = this.build()
  }

  /**
   * 获取小部件自身的虚拟节点
   *
   * @returns {VNode}
   */
  get vnode(): Readonly<WidgetVNode> {
    return this.widget['vnode']
  }

  /**
   * 获取小部件名称
   *
   * @returns {string}
   */
  get name(): string {
    return this.vnode.type.name || 'anonymous'
  }

  /**
   * 小部件实例
   *
   * @returns {Widget}
   */
  get widget(): T {
    return this.#widget
  }

  get state(): WidgetState {
    return this.#state
  }

  get child() {
    return this.#child
  }

  get el() {
    return this.#child.el
  }

  /**
   * 更新视图
   *
   * 更新视图不是同步的，会延迟更新，合并多个微任务。
   *
   * @param {VNode} newChildVNode - 新子节点，没有则使用`build`方法构建。
   * @return {void}
   * @internal 核心方法
   */
  update(newChildVNode?: VNode): void {}

  render(): RuntimeElement {
    if (this.state !== 'notRendered') {
      throw new Error(
        '[Vitarx.WidgetRenderer.render]：The component is rendered, do not render it repeatedly!'
      )
    }
    let el: RuntimeElement
    try {
      el = App.renderer.render(this.#child)
    } catch (e) {
      const errVNode = triggerLifecycleHook(this.widget, LifecycleHooks.error, e, {
        source: 'render',
        instance: this.widget
      })
      this.#child = isVNode(errVNode)
        ? errVNode
        : createVNode('comment-node', {
            children: `${this.name} componentRenderingFailed：${String(e)}`
          })
      el = App.renderer.render(this.#child)
    }
    this.#state = 'notMounted'
    this.#child.el = el
    return el
  }

  /**
   * 挂载组件
   *
   * @param container - 容器元素实例，如果`beforeMount`钩子返回了指定的容器元素，则此参数无效。
   */
  mount(container?: BaseRuntimeContainerElement) {
    if (this.state === 'notRendered') {
      this.render()
    } else if (this.state !== 'notMounted') {
      throw new Error(
        '[Vitarx.WidgetRenderer.mount]：The component is not in the state of waiting to be mounted and cannot be mounted!'
      )
    }
    const teleport = triggerLifecycleHook(this.widget, LifecycleHooks.beforeMount)
    if (typeof teleport === 'string') {
      this.#teleport = document.querySelector(teleport)
    }
    if (this.#teleport) {
      this.#teleport.appendChild(this.el as HTMLElement)
    } else {
      container?.appendChild(this.el!)
    }
    this.#state = 'activated'
    triggerLifecycleHook(this.widget, LifecycleHooks.mounted)
    triggerLifecycleHook(this.widget, LifecycleHooks.activated)
    return this
  }

  unmount(root: boolean = true) {}

  /**
   * 构建虚拟节点+依赖收集
   *
   * 每一次构建都会重新收集依赖，
   * 这样可以避免遗漏依赖造成视图不更新问题。
   *
   * @internal 核心方法
   * @protected
   */
  protected build(): VNode {
    if (this.#viewDepSubscriber) this.#viewDepSubscriber.dispose()
    const { result, subscriber } = depSubscribe((): VNode => {
      let vnode: VNode
      try {
        const buildNode = this.widget['build']()
        if (isVNode(buildNode)) {
          vnode = buildNode
        } else {
          vnode = createVNode(Fragment)
        }
      } catch (e) {
        const errVNode = triggerLifecycleHook(this.widget, LifecycleHooks.error, e, {
          source: 'build',
          instance: this.widget
        })
        // 如果构建出错，则使用错误虚拟节点
        vnode = isVNode(errVNode) ? errVNode : createVNode(Fragment)
      }
      addParentVNodeMapping(vnode, this.vnode)
      return vnode
    }, this.update)
    // 更新订阅器
    this.#viewDepSubscriber = subscriber
    // 添加到作用域中
    if (subscriber) this.widget['scope'].addEffect(subscriber)
    return result
  }
}

/**
 * 挂载虚拟节点
 *
 * @param {VNode} vnode - 要挂载的虚拟节点
 * @returns {void}
 */
export function mountVNode(vnode: VNode): void {
  if (!isVNode(vnode)) return
  if ('instance' in vnode) {
    // 挂载当前节点
    vnode.instance?.renderer.mount()
  } else if ('children' in vnode && vnode.children.length) {
    // 递归挂载子级
    vnode.children.forEach(child => mountVNode(child))
  }
}

/**
 * 卸载虚拟节点
 *
 * @param {VNode} vnode - 要卸载的虚拟节点
 * @param {boolean} [isRemoveEl=true] - 是否删除元素，默认为true
 * @returns {void}
 */
export function unmountVNode(vnode: VNode, isRemoveEl: boolean = true): void {
  if (!isVNode(vnode)) return
  if ('instance' in vnode) {
    vnode.instance?.renderer.unmount(isRemoveEl)
  } else {
    if ('children' in vnode && vnode.children.length) {
      vnode.children.forEach(child => unmountVNode(child, isRemoveEl))
      // 删除元素
      if (isRemoveEl) vnode.el?.remove()
    }
  }
}
