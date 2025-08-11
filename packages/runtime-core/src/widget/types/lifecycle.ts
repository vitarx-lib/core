import type { RuntimeElement } from '../../vnode/index'
import type { LifecycleHooks } from '../core'
import type { ErrorInfo } from './error'

/**
 * 生命周期钩子名联合类型
 */
export type LifecycleHookNames = keyof typeof LifecycleHooks
/**
 * 生命周期钩子方法名联合类型
 */
export type LifecycleHookMethods = `${LifecycleHooks}`

/**
 * 生命周期钩子需要接收的参数
 */
export type LifecycleHookParameter<T> = T extends LifecycleHooks.error
  ? [error: unknown, info: ErrorInfo]
  : T extends LifecycleHooks.beforeRemove
    ? [el: RuntimeElement, type: 'unmount' | 'deactivate']
    : []

/**
 * 生命周期钩子返回值类型
 */
export type LifecycleHookReturnType<T> = T extends LifecycleHooks.beforeMount
  ? void | string
  : T extends LifecycleHooks.error
    ? any
    : T extends LifecycleHooks.beforeRemove
      ? Promise<void> | void
      : void
