import { getContext, runInContext } from '@vitarx/responsive'
import { AnyCallback } from '@vitarx/utils'
import { WidgetVNode } from '../vnode'
import { __WIDGET_INTRINSIC_KEYWORDS__, LifecycleHooks } from './constant'
import {
  type FunctionWidget,
  type LifecycleHookParameter,
  type LifecycleHookReturnType,
  type ValidFunctionWidgetReturnValue
} from './types'
import type { Widget } from './widget'

interface CollectContext {
  exposed: Record<string, any>
  lifeCycleHooks: Record<LifecycleHooks, AnyCallback>
}

/**
 * 收集结果
 */
export interface HookCollectResult extends CollectContext {
  build: ValidFunctionWidgetReturnValue
}

const HOOK_COLLECTOR_CONTEXT = Symbol('HookCollectorContext')

/**
 * 钩子收集器
 */
export class HookCollector {
  /**
   * 获取当前上下文的方法
   * 这是一个静态getter方法，用于获取名为CollectContext的上下文对象
   * @returns {CollectContext|undefined} 返回CollectContext类型的上下文对象
   */
  static get context(): CollectContext | undefined {
    return getContext<CollectContext>(HOOK_COLLECTOR_CONTEXT) // 调用getContext函数，传入类型参数CollectContext和常量HOOK_COLLECTOR_CONTEXT
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
  static addLifeCycle(name: LifecycleHooks, fn: AnyCallback) {
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
   * @param vnode - 节点
   * @param instance - 实例
   * @returns {HookCollectResult} - 同步收集结果
   */
  static collect(vnode: WidgetVNode<FunctionWidget>, instance: Widget): HookCollectResult {
    // 创建新的上下文
    const context: HookCollectResult = {
      exposed: {},
      lifeCycleHooks: {}
    } as HookCollectResult
    const callFnWidget = () => vnode.type.call(instance, vnode.props)
    // 运行函数式组件
    context.build = runInContext(HOOK_COLLECTOR_CONTEXT, context, callFnWidget)
    return context
  }
}

/**
 * 生命周期钩子回调函数
 */
type LifecycleHookCallback<T extends LifecycleHooks> = (
  ...params: LifecycleHookParameter<T>
) => LifecycleHookReturnType<T>

/**
 * 钩子工厂函数，返回具体的钩子注册方法
 */
function createLifecycleHook<T extends LifecycleHooks>(
  hook: T
): (cb: LifecycleHookCallback<T>) => void {
  return (cb: LifecycleHookCallback<T>) => {
    if (typeof cb !== 'function') {
      throw new TypeError(`[Vitarx.LifeCycle]：${hook}钩子必须是回调函数，给定${typeof cb}`)
    }
    HookCollector.addLifeCycle(hook, cb)
  }
}

/**
 * 小部件创建时触发的钩子
 *
 * @param cb - 回调函数，小部件实例创建时触发
 */
export const onCreate = createLifecycleHook(LifecycleHooks.create)
/**
 * 小部件挂载前要触发的钩子
 *
 * 可以返回一个 DOM 元素作为挂载目标容器
 *
 * @param cb - 回调函数，小部件挂载之前触发
 */
export const onBeforeMount = createLifecycleHook(LifecycleHooks.beforeMount)
/**
 * 小部件挂载完成时触发的钩子
 *
 * @param cb - 回调函数，小部件挂载完成后触发
 */
export const onMounted = createLifecycleHook(LifecycleHooks.mounted)
/**
 * 小部件被临时停用触发的钩子
 *
 * 此钩子由`KeepAlive`内置小部件触发。
 *
 * @param cb - 回调函数，当小部件被临时停用时触发
 */
export const onDeactivated = createLifecycleHook(LifecycleHooks.deactivated)
/**
 * 小部件被激活时触发的钩子
 *
 * @param cb - 回调函数，当小部件从停用状态恢复时触发
 */
export const onActivated = createLifecycleHook(LifecycleHooks.activated)
/**
 * 小部件实例被销毁前触发的钩子
 *
 * @param cb - 回调函数，小部件实例销毁前触发
 */
export const onBeforeUnmount = createLifecycleHook(LifecycleHooks.beforeUnmount)
/**
 * 小部件被卸载时完成触发的钩子
 *
 * @param cb - 回调函数，小部件卸载完成后触发
 */
export const onUnmounted = createLifecycleHook(LifecycleHooks.unmounted)
/**
 * 小部件更新前触发的钩子
 *
 * @param cb - 回调函数，在小部件更新之前触发
 */
export const onBeforeUpdate = createLifecycleHook(LifecycleHooks.beforeUpdate)
/**
 * 小部件更新完成时触发的钩子
 *
 * @param cb - 回调函数，小部件更新完成后触发
 */
export const onUpdated = createLifecycleHook(LifecycleHooks.updated)
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
export const onError = createLifecycleHook(LifecycleHooks.error)
/**
 * 真实的`Element`被移除前触发的钩子
 *
 * 可以返回`Promise`来延迟移除
 *
 * @param cb - 回调函数，元素从DOM中被移除前触发
 */
export const onBeforeRemove = createLifecycleHook(LifecycleHooks.beforeRemove)
/**
 * 服务端预取钩子，仅在服务端渲染时有效。
 *
 * @param cb - 回调函数，可以返回Promise。
 */
export const onServerPrefetch = createLifecycleHook(LifecycleHooks.serverPrefetch)

/**
 * 暴露函数组件的内部方法或变量，供外部使用。
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
 *  // 暴露 count 和 add
 *  defineExpose({ count, add });
 *  return <div onClick={add}>{count.value}</div>;
 * }
 * ```
 *
 * 注意：键不能和{@link Widget}类中固有属性或方法重名，包括但不限于`props`，`build`...
 * (所有保留关键词：{@linkcode __WIDGET_INTRINSIC_KEYWORDS__})
 *
 * @param {Record<string, any>} exposed 键值对形式的对象，其中键为暴露的名称，值为要暴露的值。
 */
export function defineExpose(exposed: Record<string, any>): void {
  for (const exposedKey in exposed) {
    if (__WIDGET_INTRINSIC_KEYWORDS__.includes(exposedKey as any)) {
      console.warn(
        `[Vitarx.defineExpose]：${exposedKey} is an internal reserved keyword in the Widget class, please modify.`
      )
    }
  }
  HookCollector.addExposed(exposed)
}
