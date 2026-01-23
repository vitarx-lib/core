import { getStackTrace, isFunction, logger } from '@vitarx/utils'
import { Lifecycle } from '../constants/index.js'
import type { ErrorHandler, HookCallback, ViewSwitchHandler } from '../types/index.js'
import { getInstance } from './context.js'

/**
 * 钩子工厂函数，注册方法
 */
function createHookRegistrar<T extends Lifecycle>(hook: T): (cb: HookCallback<T>) => void {
  return (cb: HookCallback<T>): void => {
    if (__DEV__ && !isFunction(cb)) {
      throw new TypeError(
        `[HookRegistrar]：${hook} callback must be a callback function, given ${typeof cb}`
      )
    }
    const ctx = getInstance()
    if (!ctx) {
      logger.error('[HookRegister]：must be called in a Widget')
      return void 0
    }
    if (ctx.hooks[hook]) {
      ctx.hooks[hook].push(cb)
    } else {
      ctx.hooks[hook] = [cb]
    }
  }
}
export const onInit = createHookRegistrar(Lifecycle.init)
export const onBeforeMount = createHookRegistrar(Lifecycle.beforeMount)
export const onShow = createHookRegistrar(Lifecycle.show)
export const onHide = createHookRegistrar(Lifecycle.hide)
export const onMounted = createHookRegistrar(Lifecycle.mounted)
export const onDispose = createHookRegistrar(Lifecycle.dispose)
export const onError = (handler: ErrorHandler): void => {
  if (__DEV__ && !isFunction(handler)) {
    throw new TypeError(`onError handler must be a function`)
  }
  const ctx = getInstance()
  if (ctx) {
    ctx.errorHandler = handler
  } else {
    logger.warn(`onError must be called in a widget`, getStackTrace())
  }
}
export const onViewSwitch = (handler: ViewSwitchHandler): void => {
  if (__DEV__ && !isFunction(handler)) {
    throw new TypeError(`onSwitch handler must be a function`)
  }
  const ctx = getInstance()
  if (ctx) {
    if (__DEV__ && ctx.onViewSwitch) {
      logger.warn(`onSwitch has already been called`, getStackTrace())
    }
    ctx.onViewSwitch = handler
  } else {
    logger.warn(`onSwitch must be called in a widget`, getStackTrace())
  }
}
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
export function defineExpose<T extends { [key: string]: any }>(exposed: T): void {
  const ctx = getInstance()
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
