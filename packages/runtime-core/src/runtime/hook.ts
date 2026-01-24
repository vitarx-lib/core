import { getStackTrace, isFunction, logger } from '@vitarx/utils'
import { Lifecycle } from '../constants/index.js'
import type {
  AnyProps,
  Component,
  ErrorHandler,
  HookCallback,
  ViewSwitchHandler
} from '../types/index.js'
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
/**
 * 组件初始化钩子函数
 *
 * 在组件实例创建后立即调用，此时组件响应式数据已初始化但尚未挂载到DOM
 *
 * @param {HookCallback<Lifecycle.init>} cb - 回调函数，在组件初始化时执行
 */
export const onInit = createHookRegistrar(Lifecycle.init)

/**
 * 组件挂载前钩子函数
 *
 * 在组件即将被挂载到DOM之前调用，此时组件即将开始首次渲染。
 *
 * @param {HookCallback<Lifecycle.beforeMount>} cb - 回调函数，在组件挂载前执行
 */
export const onBeforeMount = createHookRegistrar(Lifecycle.beforeMount)

/**
 * 组件显示钩子函数
 *
 * 在组件显示时调用，通常用于处理组件可见性变化的逻辑。
 *
 * @param {HookCallback<Lifecycle.show>} cb - 回调函数，在组件显示时执行
 */
export const onShow = createHookRegistrar(Lifecycle.show)

/**
 * 组件隐藏钩子函数
 *
 * 在组件隐藏时调用，通常用于清理组件显示期间的资源。
 *
 * @param {HookCallback<Lifecycle.hide>} cb - 回调函数，在组件隐藏时执行
 */
export const onHide = createHookRegistrar(Lifecycle.hide)

/**
 * 组件已挂载钩子函数
 *
 * 在组件挂载到DOM后调用，此时可以访问DOM元素。
 *
 * @param {HookCallback<Lifecycle.mounted>} cb - 回调函数，在组件挂载完成后执行
 */
export const onMounted = createHookRegistrar(Lifecycle.mounted)

/**
 * 组件销毁钩子函数
 *
 * 在组件即将被销毁时调用，用于清理资源和取消订阅。
 *
 * @param {HookCallback<Lifecycle.dispose>} cb - 回调函数，在组件销毁时执行
 */
export const onDispose = createHookRegistrar(Lifecycle.dispose)

/**
 * 组件异常处理钩子函数
 *
 * @param handler - 异常处理函数
 */
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

/**
 * 视图切换处理器
 *
 * 仅在组件根视图是 `SwitchView` 时生效。
 *
 * 如果执行了自定义的切换逻辑，需返回切换后的视图对象阻止默认视图切换行为！
 *
 * @param handler - 视图切换处理器函数
 */
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

/**
 * 定义组件属性验证函数
 *
 * @param component - 要验证的组件
 * @param validator - 验证函数，接收组件属性作为参数
 * @returns {void} 无返回值
 */
export function defineValidate<P extends AnyProps>(
  component: Component<P>,
  validator: (props: AnyProps) => void
): void {
  if (__DEV__ && !isFunction(validator)) {
    throw new TypeError(`[defineValidate]: validator must be a function`)
  }
  // 函数无返回值
  component.validateProps = validator
}
