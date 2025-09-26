import { type RuntimeElement, VNode } from '../../vnode/index.js'
import type { LifecycleHooks } from '../constant.js'
import type { Widget } from '../widget.js'

/**
 * 错误来源联合类型
 */
export type ErrorSource =
  | 'build'
  | 'render'
  | 'update'
  | `effect.${string}`
  | `hook:${Exclude<LifecycleHookNames, 'error'>}`

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
  instance: Widget
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
  ? void | string | ParentNode
  : T extends LifecycleHooks.error
    ? VNode | void
    : T extends LifecycleHooks.beforeRemove
      ? Promise<void> | void
      : void

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

/**
 * 错误处理器类型
 *
 * @template T - 错误处理器的宿主对象类型
 */
export type ErrorHandler<T extends Widget = Widget> = (
  this: T,
  error: unknown,
  info: ErrorInfo
) => void | VNode
