import { depSubscribe, EffectScope, Subscriber } from '@vitarx/responsive'
import { createVNode } from '../../../vnode/core/creation'
import {
  addParentVNodeMapping,
  Fragment,
  isVNode,
  removeVNodeElement,
  type RuntimeElement,
  unmountVNode,
  type VNode,
  type WidgetVNode
} from '../../../vnode/index'
import type { LifecycleHookParameter, LifecycleHookReturnType } from '../../types/index'
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
  #shadowElement: RuntimeElement<'comment-node'> | null = null
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
  get vnode(): WidgetVNode {
    return this.widget['vnode']
  }

  /**
   * 当前作用域
   */
  get scope(): EffectScope {
    return this.widget.scope
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

  /**
   * 渲染组件并返回运行时元素
   * @param render - 渲染函数，接收虚拟节点并返回运行时元素
   * @returns 返回渲染后的运行时元素
   */
  render(render: (vnode: VNode) => RuntimeElement): RuntimeElement {
    // 检查组件状态，防止重复渲染
    if (this.state !== 'notRendered') {
      throw new Error(
        '[Vitarx.WidgetRenderer.render]：The component is rendered, do not render it repeatedly!'
      )
    }
    let el: RuntimeElement
    try {
      // 尝试渲染子节点
      el = render(this.#child)
    } catch (e) {
      // 渲染出错时触发错误生命周期钩子
      const errVNode = triggerLifecycleHook(this.widget, LifecycleHooks.error, e, {
        source: 'render',
        instance: this.widget
      })
      // 根据错误处理结果创建新的虚拟节点
      this.#child = isVNode(errVNode)
        ? errVNode
        : createVNode('comment-node', {
            children: `${this.name} componentRenderingFailed：${String(e)}`
          })
      // 重新渲染处理后的虚拟节点
      el = render(this.#child)
    }
    // 更新组件状态和元素引用
    this.#state = 'notMounted'
    this.#child.el = el
    return el
  }

  /**
   * 挂载组件
   *
   * @param container - 容器元素实例，如果`beforeMount`钩子返回了指定的容器元素，则此参数无效。
   */
  mount(container?: HTMLElement) {
    if (this.state === 'notRendered') {
      // this.render()
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

  /**
   * 卸载组件实例
   * @param root 是否为根节点卸载，默认为true
   */
  unmount(root: boolean = true) {
    if (this.state !== 'uninstalling' && this.state !== 'unloaded') {
      this.#state = 'uninstalling'
      const postUnmount = () => {
        // 销毁当前作用域
        this.scope?.dispose()
        // 移除占位元素
        this.#shadowElement?.remove()
        // 修改状态为已卸载
        this.#state = 'unloaded'
        // 触发onUnmounted生命周期
        this.triggerLifeCycle(LifecycleHooks.unmounted)
      }
      // 触发onBeforeUnmount生命周期
      this.triggerLifeCycle(LifecycleHooks.beforeUnmount)
      // 异步卸载标志
      let isAsyncUnmount = false
      // 如果是根节点且是激活状态，则需要触发删除元素前的回调
      if (root && this.state === 'activated') {
        const result = this.triggerLifeCycle(LifecycleHooks.beforeRemove, this.el!, 'unmount')
        // 兼容异步卸载
        if (result instanceof Promise) {
          isAsyncUnmount = true
          // 异步卸载
          result.finally(() => {
            removeVNodeElement(this.child)
            postUnmount()
          })
        }
      }
      // 递归卸载子节点
      unmountVNode(this.child, root && !isAsyncUnmount)
      // 如果不是异步卸载直接执行卸载逻辑
      if (!isAsyncUnmount) postUnmount()
    }
  }

  /**
   * 触发生命周期钩子
   *
   * @param hook - 生命周期钩子名称
   * @param args - 参数列表
   * @protected
   */
  protected triggerLifeCycle<T extends LifecycleHooks>(
    hook: T,
    ...args: LifecycleHookParameter<T>
  ): LifecycleHookReturnType<T> {
    return triggerLifecycleHook(this.widget, hook, ...args)
  }
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
