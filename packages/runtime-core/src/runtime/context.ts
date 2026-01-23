import type { App } from '../app/index.js'
import type { ComponentInstance } from '../core/index.js'

let activeComponentInstance: ComponentInstance | null = null

/**
 * 在组件上下文中执行函数的包装器，
 * 确保在函数执行期间可以获取到组件实例。
 *
 * @template T - 返回值类型
 * @param ctx - 要设置为活动实例的小部件实例
 * @param fn - 要在特定小部件实例上下文中执行的函数
 * @returns {T} 返回执行函数的结果
 */
export function runComponent<T>(ctx: ComponentInstance, fn: () => T): T {
  // 保存当前活动的小部件实例
  const preActiveWidgetRuntime = activeComponentInstance
  // 设置新的活动小部件实例
  activeComponentInstance = ctx
  try {
    // 执行传入的函数并返回其结果
    return fn()
  } finally {
    // 无论是否发生异常，都恢复之前的活动小部件实例
    activeComponentInstance = preActiveWidgetRuntime
  }
}

/**
 * 获取当前活动的小部件实例
 * 该函数返回当前激活的小部件实例，如果没有激活的小部件实例则返回null
 *
 * @returns {ComponentInstance | null} 返回当前活动的小部件实例，如果没有则返回null
 */
export function getInstance(): ComponentInstance | null {
  return activeComponentInstance
}

/**
 * 获取应用程序上下文的函数
 * 该函数用于从全局上下文中获取App类型的实例
 *
 * @template T - 应用程序实例的类型，默认为App
 * @returns {App | undefined} 返回App类型的实例，如果不存在则返回undefined
 */
export function getApp<T extends App = App>(): T | null {
  return activeComponentInstance ? (activeComponentInstance.app as T) : null
}
