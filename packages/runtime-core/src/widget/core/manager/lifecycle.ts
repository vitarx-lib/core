import type {
  ErrorSource,
  LifecycleHookParameter,
  LifecycleHookReturnType
} from '../../types/index'
import { LifecycleHooks } from '../constant'
import type { Widget } from '../widget'
import { errorHandler } from './error-hanler'
import { HookCollector } from './hooks'

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
 * 触发组件生命周期钩子
 *
 * @internal 内部核心方法，不建议外部调用！
 * @param instance - 组件实例
 * @param hook - 生命周期钩子名称
 * @param args - 参数列表
 */
export function triggerLifecycleHook<T extends LifecycleHooks>(
  instance: Widget,
  hook: T,
  ...args: LifecycleHookParameter<T>
): LifecycleHookReturnType<T> {
  const isCallOnError = hook === LifecycleHooks.error
  try {
    const method = instance[hook] as unknown as (...args: LifecycleHookParameter<T>) => any
    const result = typeof method === 'function' ? method.apply(instance, args) : undefined
    // 处理错误钩子的未处理情况
    if (isCallOnError && result === undefined) {
      return errorHandler(instance, args as LifecycleHookParameter<LifecycleHooks.error>)
    }
    return result
  } catch (e) {
    if (isCallOnError) {
      console.error(
        "[Vitarx.Widget.onError]：You can't keep throwing exceptions in the onError hook, this results in an infinite loop!"
      )
    } else {
      triggerLifecycleHook(instance, LifecycleHooks.error, e, {
        source: `hook:${hook.replace('on', '').toLowerCase()}` as ErrorSource,
        instance: instance
      })
    }
    return undefined as any
  }
}
