import type { AnyCallback } from '@vitarx/utils'
import { Lifecycle } from '../constants/index.js'
import { ComponentInstance } from '../view/index.js'
import type { View } from './view.js'

/**
 * 错误来源联合类型
 *
 * 定义了框架中可能发生错误的各种来源。
 *
 * - `effect:${string}`：表示在执行某个 effect 时发生的错误。
 * - `hook:${Lifecycle}`：表示在执行某个生命周期钩子时发生的错误。
 * - `view:switch`：表示在切换视图时发生的错误，SwitchView 发出。
 * - `view:update`：表示在更新视图时发生的错误，ElementView 发出。
 */
export type ErrorSource = `effect:${string}` | `hook:${Lifecycle}` | 'view:switch' | 'view:update'

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
  instance: ComponentInstance
}

/**
 * 错误处理器类型
 *
 * 如果返回 false 则终止错误处理流程
 */
export type ErrorHandler = (error: unknown, info: ErrorInfo) => boolean | void
/**
 * 视图切换处理器
 */
export type ViewSwitchHandler = (prev: View, next: View) => void | View
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
