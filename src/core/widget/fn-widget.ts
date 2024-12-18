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
          console.warn(
            `[Vitarx.FnWidget]：${name} 函数小部件暴露的属性名${exposedKey}是Widget类内部保留关键字，请修改。`
          )
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
  // 备份
  static #backup: CollectData | undefined

  /**
   * 收集异步函数中使用的HOOK
   *
   * @param vnode
   */
  static async asyncCollect(vnode: AsyncVNode): Promise<CollectResult> {
    this.#startCollect()
    // 等待异步函数执行完成
    const build = await vnode.type()
    return this.#endCollect(build)
  }

  /**
   * 暴露数据
   *
   * @param exposed
   */
  static addExposed(exposed: Record<string, any>) {
    if (this.#collectMap) this.#collectMap.exposed = exposed
  }

  /**
   * 添加生命周期钩子
   *
   * @param name
   * @param fn
   */
  static addLifeCycle(name: LifeCycleHooks, fn: AnyCallback) {
    if (this.#collectMap && typeof fn === 'function') {
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
    this.#startCollect()
    const build = vnode.type(vnode.props)
    return this.#endCollect(build)
  }

  // 开始收集
  static #startCollect() {
    this.#backup = this.#collectMap
    this.#collectMap = {
      exposed: undefined,
      lifeCycleHooks: undefined
    }
  }

  // 结束收集
  static #endCollect(build: BuildVNode) {
    const collectMap = this.#collectMap!
    this.#collectMap = this.#backup
    this.#backup = undefined
    return Object.assign(collectMap, { build: build })
  }
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
  HooksCollector.addExposed(exposed)
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
    HooksCollector.addLifeCycle(hook, cb)
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
 *   // 返回一个备用元素展示错误提示，error通常是Error，强制转换字符串过后会显示 message
 *   return <div>{error}</div>
 * })
 *
 * info值说明：
 *  - build: 构建时抛出的异常，通常是自身小部件的构建错误
 *  - render: 渲染时抛出的异常，通常是子组件抛出的异常
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
  HooksCollector.addLifeCycle(LifeCycleHooks.beforeRemove, cb)
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
export function createFnWidgetInstance(vnode: VNode<FnWidgetConstructor>): Widget {
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
export async function createAsyncFnWidgetInstance(vnode: AsyncVNode): Promise<FnWidget> {
  let { build, exposed, lifeCycleHooks } = await HooksCollector.asyncCollect(vnode)
  if (!isFunction(build) && !isVNode(build)) {
    throw new Error(
      `[Vitarx.createAsyncFnWidget]：${vnode.type.name} 函数不是一个有效的函数式声明小部件，返回值必须是虚拟节点或build构造器！`
    )
  }
  return new FnWidget(vnode.props, build, exposed, lifeCycleHooks)
}
