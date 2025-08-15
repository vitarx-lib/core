import { type RuntimeElement, VNode } from '../../vnode'

/**
 * 错误来源联合类型
 */
export type ErrorSource =
  | 'build'
  | 'render'
  | 'update'
  | `effect.${string}`
  | `hook:${Exclude<any, 'error'>}`

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
  instance: any
}

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
  ? void | string | HTMLElement | SVGElement
  : T extends LifecycleHooks.error
    ? VNode | void
    : T extends LifecycleHooks.beforeRemove
      ? Promise<void> | void
      : void

/** 生命周期钩子枚举 */
export enum LifecycleHooks {
  create = 'onCreate',
  beforeMount = 'onBeforeMount',
  mounted = 'onMounted',
  deactivated = 'onDeactivated',
  activated = 'onActivated',
  beforeUpdate = 'onBeforeUpdate',
  updated = 'onUpdated',
  error = 'onError',
  unmounted = 'onUnmounted',
  beforeUnmount = 'onBeforeUnmount',
  beforeRemove = 'onBeforeRemove',
  serverPrefetch = 'onServerPrefetch'
}

/**
 * 渲染状态
 *
 * - notRendered：未渲染
 * - notMounted：未挂载
 * - activated：活跃
 * - deactivating：停用中
 * - deactivated：不活跃
 * - uninstalling：卸载中
 * - unloaded：已卸载
 */
export type LifecycleState =
  | 'notRendered'
  | 'notMounted'
  | 'activated'
  | 'deactivating'
  | 'deactivated'
  | 'uninstalling'
  | 'unloaded'
