import { type IntrinsicAttributes, isVNode, type VNode } from './VNode.js'
import { Widget } from './widget.js'
import { isFunction, isRecordObject } from '../../utils/index.js'
import {
  type LifeCycleHookMethods,
  LifeCycleHooks,
  widgetIntrinsicPropKeywords
} from './life-cycle.js'


/**
 * 生命周期钩子回调函数
 */
type LifeCycleHookCallback<R = void> = (this: FnWidget) => R

/**
 * 构建虚拟节点函数类型
 */
export type BuildVNode = (() => VNode) | VNode

/**
 * 函数组件类型
 */
export type FnWidgetConstructor<P extends Record<string, any> = {}> = (
  props: P & IntrinsicAttributes
) => BuildVNode

interface CollectData {
  exposed: Record<string, any> | undefined
  lifeCycleHooks: Record<LifeCycleHooks, AnyCallback> | undefined
}

/**
 * 函数组件代理
 */
class FnWidget extends Widget {
  readonly #buildVnode: () => VNode

  constructor(
    props: {},
    build: BuildVNode,
    exposed: Record<string, any> | undefined,
    lifeCycleHooks: Record<LifeCycleHookMethods, AnyCallback> | undefined
  ) {
    super(props)
    if (isVNode(build)) {
      this.#buildVnode = () => build
    } else {
      this.#buildVnode = build
    }
    const name = this.vnode.type?.name || 'anonymous'
    if (isRecordObject(exposed)) {
      for (const exposedKey in exposed) {
        if (widgetIntrinsicPropKeywords.includes(exposedKey as any)) {
          console.warn(
            `[Vitarx]：${name} 函数组件暴露的属性名${exposedKey}是Widget类内部保留关键字，请修改。`
          )
          continue
        }
        if (!(exposedKey in this)) (this as any)[exposedKey] = exposed[exposedKey]
      }
    }
    if (lifeCycleHooks) {
      for (const lifeCycleHook in lifeCycleHooks) {
        const k = lifeCycleHook as LifeCycleHookMethods
        this[k] = lifeCycleHooks[k]
      }
    }
  }
  /**
   * @inheritDoc
   *
   * @protected
   */
  build(): VNode {
    return this.#buildVnode()
  }
}

/**
 * 收集钩子
 */
class HooksCollect {
  static #collectMap: CollectData | undefined = undefined
  static #currentVNode: VNode<FnWidgetConstructor> | undefined = undefined

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

  // 收集函数中使用的HOOK
  static collect(vnode: VNode<FnWidgetConstructor>): CollectData & {
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

  static getCurrentVNode(): VNode<FnWidgetConstructor> | undefined {
    return this.#currentVNode
  }
}

/**
 * 获取当前函数组件的虚拟节点
 *
 * 注意：如果是类组件内部获取当前虚拟节点，则使用`this.vnode`即可访问，勿使用该函数。
 *
 * @example
 * ```tsx
 * import { defineExpose,ref } from 'vitarx'
 *
 * function Foo() {
 *  const vnode = getCurrentVNode();
 *  console.log(vnode.instance); // 输出 undefined，因为此时正在解析函数组件，还未映射为FnWidget实例。
 *  onCreated(() => {
 *    console.log(vnode.instance); // 输出 FnWidget
 *  });
 *  return <div>foo</div>;
 * }
 * ```
 * @returns {VNode<FnWidgetConstructor>|undefined} 当前函数组件的虚拟节点，如果没有，则返回`undefined`
 */
export function getCurrentVNode(): VNode<FnWidgetConstructor> | undefined {
  return HooksCollect.getCurrentVNode()
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
 *  // 暴露 count 和 add，父组件可以通过refEl.value 访问到 count 和 add。
 *  defineExpose({ count, add });
 *  // 构建组件
 *  return <div onClick={add}>{count.value}</div>;
 * }
 * ```
 *
 * 注意：键不能和{@link Widget}类中的属性或固有方法重名，包括但不限于`生命周期`，`build`方法
 *
 * @param {Record<string, any>} exposed 键值对形式的对象，其中键为暴露的名称，值为要暴露的值。
 */
export function defineExpose(exposed: Record<string, any>) {
  HooksCollect.trackExposed(exposed)
}

/**
 * 创建完成时触发的钩子
 *
 * @param fn
 */
export function onCreated(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  HooksCollect.trackLifeCycle(LifeCycleHooks.created, fn)
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
  HooksCollect.trackLifeCycle(LifeCycleHooks.beforeMount, fn)
}

/**
 * 挂载完成时触发的钩子
 *
 * @param fn
 */
export function onMounted(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  HooksCollect.trackLifeCycle(LifeCycleHooks.mounted, fn)
}

/**
 * 小部件被临时停用触发的钩子
 *
 * @param fn
 */
export function onDeactivate(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  HooksCollect.trackLifeCycle(LifeCycleHooks.deactivate, fn)
}

/**
 * 小部件从停用后又恢复时触发的钩子
 *
 * @param fn
 */
export function onActivated(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  HooksCollect.trackLifeCycle(LifeCycleHooks.activated, fn)
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
  HooksCollect.trackLifeCycle(LifeCycleHooks.beforeUnmount, fn)
}

/**
 * 小部件被卸载时完成触发的钩子
 *
 * @param fn
 */
export function onUnmounted(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  HooksCollect.trackLifeCycle(LifeCycleHooks.unmounted, fn)
}

/**
 * 小部件更新前触发的钩子
 *
 * @param fn
 */
export function onBeforeUpdate(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  HooksCollect.trackLifeCycle(LifeCycleHooks.beforeUpdate, fn)
}

/**
 * 小部件更新完成时触发的钩子
 *
 * @param fn
 */
export function onUpdated(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  HooksCollect.trackLifeCycle(LifeCycleHooks.updated, fn)
}

/**
 * ## 生命周期钩子
 *
 * @param fn
 */
export function onError(fn: LifeCycleHookCallback<Vitarx.VNode | void>) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  HooksCollect.trackLifeCycle(LifeCycleHooks.error, fn)
}

/**
 * ## 创建函数组件
 *
 * @param vnode
 */
export function createFnWidget(vnode: VNode<FnWidgetConstructor>): FnWidget {
  let { build, exposed, lifeCycleHooks } = HooksCollect.collect(vnode)
  if (!isFunction(build) && !isVNode(build)) {
    throw new Error(`[Vitarx]：函数式小部件需返回一个闭包函数用于创建响应式UI，或返回VNode`)
  }
  return new FnWidget(vnode.props, build, exposed, lifeCycleHooks)
}

