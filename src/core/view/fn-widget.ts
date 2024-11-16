import { type IntrinsicAttributes, isVNode, type VNode } from './VNode.js'
import { Widget } from './widget.js'
import { isFunction, isRecordObject } from '../../utils/index.js'
import { LifeCycleHooks } from './life-cycle.js'


/**
 * 生命周期钩子回调函数
 */
type LifeCycleHookCallback<R = void> = (this: Widget) => R
/**
 * 构建虚拟节点函数类型
 */
export type BuildVNode = (() => VNode) | VNode
/**
 * 函数组件类型
 */
export type FnWidget<P extends Record<string, any> = {}> = (
  props: P & IntrinsicAttributes
) => BuildVNode
interface CollectMap {
  exposed: Record<string, any> | undefined
  lifeCycleHooks: Record<LifeCycleHooks, AnyCallback> | undefined
}

/**
 * 函数组件代理
 */
class FnWidgetProxy extends Widget {
  readonly #buildVnode: () => VNode

  constructor(
    props: {},
    build: BuildVNode,
    exposed?: Record<string, any>,
    lifeCycleHooks?: Record<LifeCycleHooks, AnyCallback>
  ) {
    super(props)
    if (isVNode(build)) {
      this.#buildVnode = () => build
    } else {
      this.#buildVnode = build
    }
    if (isRecordObject(exposed)) {
      Object.entries(exposed).forEach(item => {
        const [key, value] = item
        if (!(key in this)) (this as any)[key] = value
      })
    }
    if (lifeCycleHooks) {
      Object.entries(lifeCycleHooks).forEach(item => {
        const [name, fn] = item
        ;(this as any)[name] = fn
      })
    }
  }
  /**
   * @inheritDoc
   *
   * @protected
   */
  public build(): VNode {
    return this.#buildVnode()
  }
}

/**
 * 收集hook
 */
class FnWidgetHookHandler {
  static #collectMap: CollectMap | undefined = undefined
  static #currentVNode: VNode<FnWidget> | undefined = undefined

  static trackExposed(exposed: Record<string, any>) {
    if (this.#collectMap) this.#collectMap.exposed = exposed
  }

  static trackLifeCycle(name: LifeCycleHooks, fn: AnyCallback) {
    if (this.#collectMap) {
      if (!this.#collectMap.lifeCycleHooks) {
        this.#collectMap.lifeCycleHooks = { [name]: fn } as any
      } else {
        this.#collectMap.lifeCycleHooks[name] = fn
      }
    }
  }

  static collect(vnode: VNode<FnWidget>): CollectMap & {
    build: any
  } {
    const oldBackup = this.#collectMap
    const oldVNode = this.#currentVNode
    this.#collectMap = {
      exposed: undefined,
      lifeCycleHooks: undefined
    }
    this.#currentVNode = vnode
    const build = vnode.type(vnode.props)
    const collectMap = this.#collectMap
    this.#collectMap = oldBackup
    this.#currentVNode = oldVNode
    return { ...collectMap, build }
  }

  static getCurrentVNode(): VNode<FnWidget> | undefined {
    return this.#currentVNode
  }
}

/**
 * 获取当前函数组件的虚拟节点
 *
 * ```ts
 * import { defineExpose,ref } from 'vitarx'
 *
 * function Foo() {
 *  const vnode = getCurrentVNode();
 *  console.log(vnode.instance); // 输出 undefined，因为此时正在解析函数组件，还未创建实例。
 *  onCreated(() => {
 *    console.log(vnode.instance); // 输出 FnWidgetProxy
 *  });
 *  return <div>foo</div>;
 * }
 * ```
 */
export function getCurrentVNode(): VNode<FnWidget> | undefined {
  return FnWidgetHookHandler.getCurrentVNode()
}

/**
 * 暴露函数组件的内部方法或变量，供外部使用。
 *
 * 一般情况下是用于暴露一个函数，给父组件调用，但也可以暴露一个变量
 *
 * @example
 * ```ts
 * import { defineExpose,ref } from 'vitarx'
 *
 * function Foo() {
 *  const count = ref(0);
 *  const add = () => count.value++;
 *  // 暴露 count 和 add
 *  defineExpose({ count, add });
 *  // 构建组件
 *  return () => <div onClick={add}>{count.value}</div>;
 * }
 * ```
 *
 * @param exposed
 */
export function defineExpose(exposed: Record<string, any>) {
  FnWidgetHookHandler.trackExposed(exposed)
}

/**
 * 创建完成时触发的钩子
 *
 * @param fn
 */
export function onCreated(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.created, fn)
}

/**
 * 挂载前要触发的钩子
 *
 * 可以返回一个`Element`，用于将组件挂载到指定的元素上
 *
 * @param fn
 */
export function onBeforeMount(fn: LifeCycleHookCallback<void | Element>) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.beforeMount, fn)
}

/**
 * 挂载完成时触发的钩子
 *
 * @param fn
 */
export function onMounted(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.mounted, fn)
}

/**
 * 小部件被临时停用触发的钩子
 *
 * @param fn
 */
export function onDeactivate(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.deactivate, fn)
}

/**
 * 小部件从停用后又恢复时触发的钩子
 *
 * @param fn
 */
export function onActivated(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.activated, fn)
}

/**
 * 小部件实例被销毁前触发的钩子
 *
 * 在构造中返回`true`可告知渲染器`el`销毁逻辑已被接管，渲染器会跳过`el.remove()`
 *
 * @param fn
 */
export function onBeforeUnmount(fn: LifeCycleHookCallback<void | boolean>) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.beforeUnmount, fn)
}

/**
 * 小部件被卸载时完成触发的钩子
 *
 * @param fn
 */
export function onUnmounted(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.unmounted, fn)
}

/**
 * 小部件更新前触发的钩子
 *
 * @param fn
 */
export function onBeforeUpdate(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.beforeUpdate, fn)
}

/**
 * 小部件更新完成时触发的钩子
 *
 * @param fn
 */
export function onUpdated(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.updated, fn)
}

/**
 * ## 生命周期钩子
 *
 * @param fn
 */
export function onError(fn: LifeCycleHookCallback<Vitarx.VNode | void>) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.error, fn)
}
/**
 * ## 创建函数组件
 *
 * @param vnode
 */
export function createFnWidget(vnode: VNode<FnWidget>): FnWidgetProxy {
  let { build, exposed, lifeCycleHooks } = FnWidgetHookHandler.collect(vnode)
  if (!isFunction(build) && !isVNode(build)) {
    throw new Error(`[Vitarx]：函数式小部件需返回一个闭包函数用于创建响应式UI，或返回VNode`)
  }
  return new FnWidgetProxy(vnode.props, build, exposed, lifeCycleHooks)
}
