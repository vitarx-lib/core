import type { AnyCallback } from '@vitarx/utils'
import { Lifecycle } from '../constants/index.js'
import type { PublicComponentInstance } from './component.js'
import type { View } from './view.js'

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
export type ErrorSource = `effect:${string}` | `hook:${Lifecycle}`

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
  instance: PublicComponentInstance
}

/**
 * 错误处理器类型
 */
export type ErrorHandler = (error: unknown, info: ErrorInfo) => boolean | void
/**
 * 组件根视图切换处理器类型
 */
export type ViewSwitchHandler = (next: View, prev: View) => void | false
/**
 * 生命周期钩子映射表
 * 存储各个生命周期对应的回调函数数组
 */
export type HookStore = {
  [K in Lifecycle]?: AnyCallback[]
}

/**
 * 生命周期钩子返回值类型
 * 根据钩子类型推导返回值类型
 */
type HookReturn<T> = T extends Lifecycle.init ? Promise<void> | void : void

/**
 * 生命周期钩子回调函数类型
 */
export type HookCallback<T extends Lifecycle> = () => HookReturn<T>
