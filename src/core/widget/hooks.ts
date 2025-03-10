import { Widget } from './widget.js'
import { type HookParameter, type HookReturnType, LifeCycleHooks } from './life-cycle.js'
import { __widgetIntrinsicPropKeywords__ } from './constant.js'
import { getCurrentVNode, type VNode, type WidgetVNode } from '../vnode/index.js'
import { getContext, runContext } from '../context/index.js'
import { type BuildVNode, FnWidget, type FnWidgetConstructor } from './fn-widget.js'
import type { ContainerElement } from '../renderer/index.js'
import CoreLogger from '../CoreLogger.js'

/**
 * 生命周期钩子回调函数
 */
type LifeCycleHookCallback<T extends LifeCycleHooks> = (
  this: FnWidget,
  ...params: HookParameter<T>
) => HookReturnType<T>

interface CollectContext {
  exposed: Record<string, any>
  lifeCycleHooks: Record<LifeCycleHooks, AnyCallback>
}

/**
 * 收集结果
 */
export interface CollectResult extends CollectContext {
  build: BuildVNode | Promise<BuildVNode>
}

type BeforeRemoveCallback<T extends ContainerElement> = (
  this: FnWidget,
  el: T,
  type: 'unmount' | 'deactivate'
) => Promise<void> | void

/**
 * 钩子收集器
 */
class HooksCollector {
  static #hookCollectorContext = Symbol('HookCollectorContext')

  static get context() {
    return getContext<CollectContext>(HooksCollector.#hookCollectorContext)
  }

  /**
   * 暴露数据
   *
   * @param exposed
   */
  static addExposed(exposed: Record<string, any>) {
    const ctx = this.context
    if (ctx) ctx.exposed = exposed
  }

  /**
   * 添加生命周期钩子
   *
   * @param name
   * @param fn
   */
  static addLifeCycle(name: LifeCycleHooks, fn: AnyCallback) {
    const ctx = this.context
    if (ctx && typeof fn === 'function') {
      if (!ctx.lifeCycleHooks) {
        ctx.lifeCycleHooks = { [name]: fn } as any
      } else {
        ctx.lifeCycleHooks[name] = fn
      }
    }
  }

  /**
   * 收集函数中使用的HOOK
   *
   * @param vnode
   * @returns {CollectResult} - 同步收集结果
   */
  static collect(vnode: WidgetVNode<FnWidgetConstructor>): CollectResult {
    const instance = new FnWidget(vnode.props)
    // 新的实例
    vnode.instance = instance
    // 创建新的上下文
    const context: CollectResult = {
      exposed: {},
      lifeCycleHooks: {}
    } as CollectResult
    // 为组件注入`instance`
    const callFnWidget = () => vnode.type.call(instance, vnode.props)
    // 运行函数式组件
    context.build = runContext(this.#hookCollectorContext, context, callFnWidget)
    return context
  }
}

/**
 * 暴露函数小部件的内部方法或变量，供外部使用。
 *
 * 它们会被注入到`FnWidget`实例中，注意`this`指向！
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
 *  return <div onClick={add}>{count.value}</div>;
 * }
 * ```
 *
 * 注意：键不能和{@link Widget}类中固有属性或方法重名，包括但不限于`生命周期方法`，`build`...
 * (所有固有关键词：{@linkcode __widgetIntrinsicPropKeywords__})
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
 * 小部件创建完成时触发的钩子
 *
 * @param cb - 回调函数，小部件实例创建后触发
 */
export const onCreated = createLifeCycleHook(LifeCycleHooks.created)

/**
 * 小部件挂载前要触发的钩子
 *
 * 可以返回一个 DOM 元素作为挂载目标容器
 *
 * @param cb - 回调函数，小部件挂载之前触发
 */
export const onBeforeMount = createLifeCycleHook(LifeCycleHooks.beforeMount)

/**
 * 小部件挂载完成时触发的钩子
 *
 * @param cb - 回调函数，小部件挂载完成后触发
 */
export const onMounted = createLifeCycleHook(LifeCycleHooks.mounted)

/**
 * 小部件被临时停用触发的钩子
 *
 * 此钩子由`KeepAlive`内置小部件触发。
 *
 * @param cb - 回调函数，当小部件被临时停用时触发
 */
export const onDeactivated = createLifeCycleHook(LifeCycleHooks.deactivated)

/**
 * 小部件被激活时触发的钩子
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
 *   return <div>{String(error)}</div>
 * })
 *
 * info值说明：
 *  - build: 构建视图时捕获的异常
 *  - render: 渲染时视图时捕获的异常
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
export const onBeforeRemove = createLifeCycleHook(LifeCycleHooks.beforeRemove)

/**
 * 收集函数中使用的HOOK
 *
 * @param vnode
 * @returns {CollectResult} - 同步收集结果
 * @internal
 */
export function _hooksCollector(vnode: WidgetVNode<FnWidgetConstructor>): CollectResult {
  return HooksCollector.collect(vnode)
}

type FnViewForceUpdating = (newChildVNode?: VNode) => void

/**
 * 获取视图强制更新器
 *
 * 此函数返回的是一个用于更新视图的函数，通常你不需要强制更新视图，响应式数据改变会自动更新视图。
 *
 * 如果函数式组件返回的虚拟元素节点是预构建的，系统无法在初次构建视图时捕获其依赖的响应式数据，
 * 从而导致视图不会随着数据改变而更新。在这种特殊情况下你就可以使用该函数返回的视图更新器来更新视图。
 *
 * @returns {FnViewForceUpdating} - 视图更新器
 */
export function useViewForceUpdating(): FnViewForceUpdating {
  const instance = getCurrentVNode()?.instance
  if (!instance) {
    CoreLogger.error(
      'useViewForceUpdating',
      'useViewForceUpdating API函数只能在函数组件的顶层作用域中使用！'
    )
  }
  return instance?.['update'] || (() => {})
}

/**
 * 获取当前组件实例
 *
 * @returns {Widget|undefined} - 如果存在则返回当前组件实例，否则返回`undefined`
 */
export function useCurrentInstance(): Widget | undefined {
  return getCurrentVNode()?.instance
}
