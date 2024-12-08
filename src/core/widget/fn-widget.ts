// noinspection JSUnusedGlobalSymbols

import { type Element, Widget } from './widget.js'
import { isFunction, isRecordObject } from '../../utils/index.js'
import {
  type HookParameter,
  type HookReturnType,
  type LifeCycleHookMethods,
  LifeCycleHooks
} from './life-cycle.js'
import { __widgetIntrinsicPropKeywords__ } from './constant.js'
import { type IntrinsicAttributes, isVNode, type VNode } from '../vnode/index.js'
import type { ContainerElement } from '../renderer/web-runtime-dom/index.js'

/**
 * 生命周期钩子回调函数
 */
type LifeCycleHookCallback<T extends LifeCycleHooks> = (
  this: FnWidget,
  ...params: HookParameter<T>
) => HookReturnType<T>

/**
 * 构建虚拟节点函数类型
 */
export type BuildVNode = (() => VNode) | VNode

/**
 * 函数小部件类型
 */
export type FnWidgetConstructor<P extends Record<string, any> = any> = (
  props: P & IntrinsicAttributes
) => BuildVNode

/** 异步函数式小部件虚拟节点 */
export interface AsyncVNode extends Omit<VNode, 'type'> {
  type: () => Promise<Element>
}

interface CollectData {
  exposed: Record<string, any> | undefined
  lifeCycleHooks: Record<LifeCycleHooks, AnyCallback> | undefined
}

interface CollectResult extends CollectData {
  build: any
}

type BeforeRemoveCallback<T extends ContainerElement> = (
  this: FnWidget,
  el: T,
  type: 'unmount' | 'deactivate'
) => Promise<void> | void

/**
 * 函数小部件代理
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
        if (__widgetIntrinsicPropKeywords__.includes(exposedKey as any)) {
          console.error(
            `[Vitarx.FnWidget]：${name} 函数小部件暴露的属性名${exposedKey}是Widget类内部保留关键字，请修改。`
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
 * 钩子收集器
 */
class HooksCollector {
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

  /**
   * 收集函数中使用的HOOK
   *
   * @param vnode
   */
  static collect(vnode: VNode<FnWidgetConstructor>): CollectResult {
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

  /**
   * 收集异步函数中使用的HOOK
   *
   * @param vnode
   */
  static async asyncCollect(vnode: AsyncVNode): Promise<CollectResult> {
    const oldBackup = this.#collectMap
    const oldVNode = this.#currentVNode
    this.#collectMap = {
      exposed: undefined,
      lifeCycleHooks: undefined
    }
    this.#currentVNode = vnode as unknown as VNode<FnWidgetConstructor>
    const build = await vnode.type()
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
 * 获取当前函数小部件的虚拟节点
 *
 * 注意：如果是类小部件内部获取当前虚拟节点，则使用`this.vnode`即可访问，勿使用该函数。
 *
 * @example
 * ```tsx
 * import { defineExpose,ref } from 'vitarx'
 *
 * function Foo() {
 *  const vnode = getCurrentVNode();
 *  console.log(vnode.instance); // 输出 undefined，因为此时正在解析函数小部件，还未映射为FnWidget实例。
 *  onCreated(() => {
 *    console.log(vnode.instance); // 输出 FnWidget
 *  });
 *  return <div>foo</div>;
 * }
 * ```
 * @returns {VNode<FnWidgetConstructor>|undefined} 当前函数小部件的虚拟节点，如果没有，则返回`undefined`
 */
export function getCurrentVNode(): VNode<FnWidgetConstructor> | undefined {
  return HooksCollector.getCurrentVNode()
}

/**
 * 暴露函数小部件的内部方法或变量，供外部使用。
 *
 * 一般情况下是用于暴露一个函数，给父小部件调用，但也可以暴露一个变量
 *
 * @example
 * ```ts
 * import { defineExpose,ref } from 'vitarx'
 *
 * function Foo() {
 *  const count = ref(0);
 *  const add = () => count.value++;
 *  // 暴露 count 和 add，父小部件可以通过refEl.value 访问到 count 和 add。
 *  defineExpose({ count, add });
 *  // 构建小部件
 *  return <div onClick={add}>{count.value}</div>;
 * }
 * ```
 *
 * 注意：键不能和{@link Widget}类中的属性或固有方法重名，包括但不限于`生命周期`，`build`方法
 *
 * @param {Record<string, any>} exposed 键值对形式的对象，其中键为暴露的名称，值为要暴露的值。
 */
export function defineExpose(exposed: Record<string, any>): void {
  HooksCollector.trackExposed(exposed)
}

/**
 * 钩子工厂函数，返回具体的钩子注册方法
 */
function createLifeCycleHook<T extends LifeCycleHooks>(
  hook: T
): (cb: LifeCycleHookCallback<T>) => void {
  return function (cb: LifeCycleHookCallback<T>) {
    if (typeof cb !== 'function') {
      throw new TypeError(`[Vitarx.LifeCycle]：${hook}钩子必须是回调函数，给定${typeof cb}`)
    }
    HooksCollector.trackLifeCycle(hook, cb)
  }
}

/**
 * 创建完成时触发的钩子
 *
 * @param cb - 回调函数，小部件实例创建后触发
 */
export const onCreated = createLifeCycleHook(LifeCycleHooks.created)

/**
 * 挂载前要触发的钩子
 *
 * 可以返回一个 DOM 元素作为挂载目标容器
 *
 * @param cb - 回调函数，小部件挂载之前触发
 */
export const onBeforeMount = createLifeCycleHook(LifeCycleHooks.beforeMount)

/**
 * 挂载完成时触发的钩子
 *
 * @param cb - 回调函数，小部件挂载完成后触发
 */
export const onMounted = createLifeCycleHook(LifeCycleHooks.mounted)

/**
 * 小部件被临时停用触发的钩子
 *
 * @param cb - 回调函数，当小部件被临时停用时触发
 */
export const onDeactivate = createLifeCycleHook(LifeCycleHooks.deactivate)

/**
 * 小部件从停用后又恢复时触发的钩子
 *
 * @param cb - 回调函数，当小部件从停用状态恢复时触发
 */
export const onActivated = createLifeCycleHook(LifeCycleHooks.activated)

/**
 * 小部件实例被销毁前触发的钩子
 *
 * @param cb - 回调函数，小部件实例销毁前触发
 */
export const onBeforeUnmount = createLifeCycleHook(LifeCycleHooks.beforeUnmount)

/**
 * 小部件被卸载时完成触发的钩子
 *
 * @param cb - 回调函数，小部件卸载完成后触发
 */
export const onUnmounted = createLifeCycleHook(LifeCycleHooks.unmounted)

/**
 * 小部件更新前触发的钩子
 *
 * @param cb - 回调函数，在小部件更新之前触发
 */
export const onBeforeUpdate = createLifeCycleHook(LifeCycleHooks.beforeUpdate)

/**
 * 小部件更新完成时触发的钩子
 *
 * @param cb - 回调函数，小部件更新完成后触发
 */
export const onUpdated = createLifeCycleHook(LifeCycleHooks.updated)

/**
 * 小部件渲染或构建过程中捕获到异常时触发的钩子
 *
 * @example
 * onError((error, info) => {
 *   console.error(error, info)
 *   return <div>{error}</div>
 * })
 *
 * @param cb - 回调函数，遇到错误时触发
 */
export const onError = createLifeCycleHook(LifeCycleHooks.error)

/**
 * 真实的`Element`被移除前触发的钩子
 *
 * 可以返回`Promise`来延迟移除
 *
 * @param cb - 回调函数，元素从DOM中被移除前触发
 */
export function onBeforeRemove<T extends ContainerElement>(cb: BeforeRemoveCallback<T>) {
  if (typeof cb !== 'function') {
    throw new TypeError(
      `[Vitarx.LifeCycle]：${LifeCycleHooks.beforeRemove}钩子必须是回调函数，给定${typeof cb}`
    )
  }
  HooksCollector.trackLifeCycle(LifeCycleHooks.beforeRemove, cb)
}

/**
 * ## 构建器。
 *
 * > 注意：在类小部件中不要使用`build`函数，类中的build方法就是构建器。
 *
 * 主要作用是优化TSX类型校验。
 *
 * 代码块中的顶级return语句如果是jsx语法，则会被自动添加箭头函数，使其成为一个UI构造器。
 *
 * 如果你的代码不是位于函数的一级块中，或你返回的是一个三元运算等不被支持自动优化的情况，请使用`build`函数包裹。
 *
 * 如果你没有使用tsx，则可以直接使用 `return () => <div>...</div>` 这样的语法。
 *
 * ```tsx
 * // 下面的两个return语句的效果是一致的
 * // 它们的不同之处是在tsx文件中返回箭头函数用于构建ui会导致类型错误，所以在tsx文件中需要使用build包裹
 * return build(() => state ? <div>真</div> : <div>假</div>)
 * return () => state ? <div>真</div> : <div>假</div>
 * ```
 *
 * @param vnode - 虚拟节点对象或闭包函数返回虚拟节点对象
 */
export function build(vnode: VNode | (() => VNode)): VNode {
  if (typeof vnode === 'function') return vnode as unknown as VNode
  return (() => vnode) as unknown as VNode
}

/**
 * ## 创建函数小部件
 *
 * @param vnode
 */
export function createFnWidget(vnode: VNode<FnWidgetConstructor>): Widget {
  let { build, exposed, lifeCycleHooks } = HooksCollector.collect(
    vnode as VNode<FnWidgetConstructor>
  )
  if (!isFunction(build) && !isVNode(build)) {
    throw new Error(
      `[Vitarx.createFnWidget]：${vnode.type.name} 函数不是一个有效的函数式声明小部件，返回值必须是虚拟节点或build构造器！`
    )
  }
  return new FnWidget(vnode.props, build, exposed, lifeCycleHooks)
}

/**
 * 创建异步函数小部件
 *
 * @param vnode
 */
export async function createAsyncFnWidget(vnode: AsyncVNode): Promise<FnWidget> {
  let { build, exposed, lifeCycleHooks } = await HooksCollector.asyncCollect(vnode)
  if (!isFunction(build) && !isVNode(build)) {
    throw new Error(
      `[Vitarx.createAsyncFnWidget]：${vnode.type.name} 函数不是一个有效的函数式声明小部件，返回值必须是虚拟节点或build构造器！`
    )
  }
  return new FnWidget(vnode.props, build, exposed, lifeCycleHooks)
}
