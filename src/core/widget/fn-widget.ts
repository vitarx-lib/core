import { type Element, Widget } from './widget.js'
import { isFunction, isRecordObject } from '../../utils/index.js'
import { type ErrorInfo, type LifeCycleHookMethods, LifeCycleHooks } from './life-cycle.js'
import { __widgetIntrinsicPropKeywords__ } from './constant.js'
import { type IntrinsicAttributes, isVNode, type VNode } from '../vnode/index.js'

/**
 * 生命周期钩子回调函数
 */
type LifeCycleHookCallback<R = void> = (this: FnWidget) => R

/**
 * onError生命周期钩子
 *
 * @param {unknown} error - 捕获到的异常对象
 * @param {ErrorInfo} info - 捕获异常的阶段，可以是`build`或`render`
 * @returns {void|Element} - 返回一个`Vitarx.Element`，做为后备内容展示。
 */
type OnErrorCallback = (this: FnWidget, error: unknown, info: ErrorInfo) => void | Element

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

/** 异步函数式组件虚拟节点 */
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
        if (__widgetIntrinsicPropKeywords__.includes(exposedKey as any)) {
          console.error(
            `[Vitarx.FnWidget]：${name} 函数组件暴露的属性名${exposedKey}是Widget类内部保留关键字，请修改。`
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
export class _HooksCollector {
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
  return _HooksCollector.getCurrentVNode()
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
  _HooksCollector.trackExposed(exposed)
}

/**
 * 创建完成时触发的钩子
 *
 * @param fn
 */
export function onCreated(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子回调函数，${typeof fn}`)
  _HooksCollector.trackLifeCycle(LifeCycleHooks.created, fn)
}

/**
 * 挂载前要触发的钩子
 *
 * 可以返回一个`Element`，用于将组件挂载到指定的元素上
 *
 * @param fn
 */
export function onBeforeMount(fn: LifeCycleHookCallback<void | Element>) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子回调函数，${typeof fn}`)
  _HooksCollector.trackLifeCycle(LifeCycleHooks.beforeMount, fn)
}

/**
 * 挂载完成时触发的钩子
 *
 * @param fn
 */
export function onMounted(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子回调函数，${typeof fn}`)
  _HooksCollector.trackLifeCycle(LifeCycleHooks.mounted, fn)
}

/**
 * 小部件被临时停用触发的钩子
 *
 * @param fn
 */
export function onDeactivate(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子回调函数，${typeof fn}`)
  _HooksCollector.trackLifeCycle(LifeCycleHooks.deactivate, fn)
}

/**
 * 小部件从停用后又恢复时触发的钩子
 *
 * @param fn
 */
export function onActivated(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子回调函数，${typeof fn}`)
  _HooksCollector.trackLifeCycle(LifeCycleHooks.activated, fn)
}

/**
 * 小部件实例被销毁前触发的钩子
 *
 * 在构造中返回`true`可告知渲染器`el`销毁逻辑已被接管，渲染器会跳过`el.remove()`
 *
 * 如果返回`true`过后，务必在执行完自定义的卸载逻辑过后删除`el`，否则它将永远存在于视图中。
 *
 * @param fn
 */
export function onBeforeUnmount(fn: (this: FnWidget, root: boolean) => void | boolean) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子回调函数，${typeof fn}`)
  _HooksCollector.trackLifeCycle(LifeCycleHooks.beforeUnmount, fn)
}

/**
 * 小部件被卸载时完成触发的钩子
 *
 * @param fn
 */
export function onUnmounted(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子回调函数，${typeof fn}`)
  _HooksCollector.trackLifeCycle(LifeCycleHooks.unmounted, fn)
}

/**
 * 小部件更新前触发的钩子
 *
 * @param fn
 */
export function onBeforeUpdate(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子回调函数，${typeof fn}`)
  _HooksCollector.trackLifeCycle(LifeCycleHooks.beforeUpdate, fn)
}

/**
 * 小部件更新完成时触发的钩子
 *
 * @param fn - 钩子回调函数
 */
export function onUpdated(fn: LifeCycleHookCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子回调函数，${typeof fn}`)
  _HooksCollector.trackLifeCycle(LifeCycleHooks.updated, fn)
}

/**
 * 小部件渲染或构建过程中捕获到异常时触发的钩子
 *
 * @example
 * onError((error, info) => {
 *   console.error(error, info)
 *   return <div>{error}</div>
 * })
 *
 * @param fn
 */
export function onError(fn: OnErrorCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子回调函数，${typeof fn}`)
  _HooksCollector.trackLifeCycle(LifeCycleHooks.error, fn)
}

/**
 * ## 构建器。
 *
 * > 注意：在类组件中不要使用`build`函数，类中的build方法就是构建器。
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
 *
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
 * ## 创建函数组件
 *
 * @param vnode
 */
export function createFnWidget(vnode: VNode<FnWidgetConstructor>): Widget {
  let { build, exposed, lifeCycleHooks } = _HooksCollector.collect(
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
 * 创建异步函数组件
 *
 * @param vnode
 */
export async function createAsyncFnWidget(vnode: AsyncVNode): Promise<FnWidget> {
  let { build, exposed, lifeCycleHooks } = await _HooksCollector.asyncCollect(vnode)
  if (!isFunction(build) && !isVNode(build)) {
    throw new Error(
      `[Vitarx.createAsyncFnWidget]：${vnode.type.name} 函数不是一个有效的函数式声明小部件，返回值必须是虚拟节点或build构造器！`
    )
  }
  return new FnWidget(vnode.props, build, exposed, lifeCycleHooks)
}
