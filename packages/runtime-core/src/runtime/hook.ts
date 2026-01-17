import { isFunction, logger } from '@vitarx/utils'
import type { AnyCallback } from '@vitarx/utils/src/index.js'
import { LifecycleStage } from '../shared/constants/lifecycle.js'
import type { WidgetPublicInstance } from '../types/index.js'
import { getWidgetInstance } from './context.js'

/**
 * 错误来源联合类型
 *
 * 定义了框架中可能发生错误的各种来源。
 *
 * @example
 * ```ts
 * const effectSource: ErrorSource = 'effect:watcher';
 * const hookSource: ErrorSource = 'hook:mounted';
 * ```
 */
export type ErrorSource = `effect:${string}` | `hook:${LifecycleStage}`

/**
 * 错误信息对象接口
 */
export interface ErrorInfo {
  /**
   * 错误来源
   */
  source: ErrorSource
  /**
   * 抛出异常的实例
   */
  instance: WidgetPublicInstance
}

/**
 * 错误处理器类型
 */
export type ErrorHandler = (
  this: WidgetPublicInstance,
  error: unknown,
  info: ErrorInfo
) => boolean | void

/**
 * 生命周期钩子映射表
 * 存储各个生命周期对应的回调函数数组
 */
export type HookStore = {
  [K in LifecycleStage | 'error']?: AnyCallback[]
}
/**
 * 生命周期钩子参数类型
 * 根据钩子类型推导参数列表
 */
type HookParams<T> = T extends 'error' ? [error: unknown, info: ErrorInfo] : []
/**
 * 生命周期钩子返回值类型
 * 根据钩子类型推导返回值类型
 */
type HookReturn<T> = T extends 'error'
  ? boolean | void
  : T extends LifecycleStage.prepare
    ? Promise<void> | void
    : void

/**
 * 生命周期钩子回调函数类型
 */
export type HookCallback<T extends LifecycleStage | 'error'> = (
  this: WidgetPublicInstance,
  ...params: HookParams<T>
) => HookReturn<T>

/**
 * 钩子工厂函数，注册方法
 */
function createHookRegistrar<T extends LifecycleStage | 'error'>(
  hook: T
): (cb: HookCallback<T>) => void {
  return (cb: HookCallback<T>): void => {
    const ctx = getWidgetInstance()
    if (!ctx) {
      logger.error('[HookRegister]：must be called in a Widget')
      return void 0
    }
    if (!isFunction(cb)) {
      throw new TypeError(
        `[HookRegistrar]：${hook} callback must be a callback function, given ${typeof cb}`
      )
    }
    if (ctx.hooks[hook]) {
      ctx.hooks[hook].push(cb)
    } else {
      ctx.hooks[hook] = [cb]
    }
  }
}
/**
 * 小部件初始化时触发的钩子
 *
 * 注册的回调函数在客户端/服务端都会触发。
 *
 * 支持返回 `Promise` ，使上级 `Suspense` 处于挂起状态。
 *
 * @param {Function} cb - 回调函数，小部件初始化时触发
 */
export const onSetup = createHookRegistrar(LifecycleStage.prepare)
/**
 * 小部件挂载前要触发的钩子
 *
 * 可以返回一个 DOM 元素作为挂载目标容器
 *
 * @param {Function} cb - 回调函数，小部件挂载之前触发
 */
export const onBeforeMount = createHookRegistrar(LifecycleStage.beforeMount)
/**
 * 小部件挂载完成时触发的钩子
 *
 * @param {Function} cb - 回调函数，小部件挂载完成后触发
 */
export const onMounted = createHookRegistrar(LifecycleStage.mounted)
/**
 * 小部件被临时停用触发的钩子
 *
 * 此钩子由 `KeepAlive` 触发。
 *
 * @param {Function} cb - 回调函数，当小部件被临时停用时触发
 */
export const onDeactivated = createHookRegistrar(LifecycleStage.deactivated)
/**
 * 小部件被激活时触发的钩子
 *
 * @param {Function} cb - 回调函数，当小部件从停用状态恢复时触发
 */
export const onActivated = createHookRegistrar(LifecycleStage.activated)
/**
 * 小部件运行时捕获到异常时触发
 *
 * @example
 * ```ts
 * onError((error, info:ErrorInfo) => {
 *   console.error(error, info)
 *   // 返回false可以阻止异常继续向上传播
 *   return false
 * })
 *```
 *
 * @param handler - 错误处理函数
 */
export const onError = createHookRegistrar('error')
/**
 * 小部件运行时实例销毁时触发的钩子
 *
 * @param {Function} cb - 回调函数，运行时实例销毁时触发
 */
export const onDispose = createHookRegistrar(LifecycleStage.dispose)
/**
 * 暴露函数组件的内部成员，供外部ref使用。
 *
 * @example
 * ```tsx
 * import { defineExpose,ref } from 'vitarx'
 *
 * function Foo() {
 *  const count = ref(0);
 *  const add = () => count.value++;
 *  // 暴露 count 和 add
 *  defineExpose({ count, add });
 *  return <div onClick={add}>{count}</div>;
 * }
 * ```
 *
 * @param {Record<string, any>} exposed - 键值对对象。
 */
export function defineExpose(exposed: Record<string, any>): void {
  const ctx = getWidgetInstance()
  if (!ctx) {
    logger.error('[defineExpose]：defineExpose must be called in a WidgetContext')
    return void 0
  }
  const publicInstance = ctx.publicInstance
  for (const exposedKey in exposed) {
    Object.defineProperty(publicInstance, exposedKey, {
      get(): any {
        return exposed[exposedKey]
      },
      enumerable: true
    })
  }
}
