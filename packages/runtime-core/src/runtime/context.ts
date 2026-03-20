import type { App } from '../app/index.js'
import type { ComponentInstance, ComponentView } from '../view/index.js'

let activeComponentInstance: ComponentInstance | null = null

/**
 * 在组件上下文中执行函数的包装器，
 * 确保在函数执行期间可以获取到组件实例。
 *
 * @template T - 返回值类型
 * @param instance - 要设置为活动实例的小部件实例
 * @param fn - 要在特定小部件实例上下文中执行的函数
 * @returns {T} 返回执行函数的结果
 */
export function runComponent<T>(instance: ComponentInstance, fn: () => T): T {
  // 保存当前活跃的小部件实例
  const preActiveWidgetRuntime = activeComponentInstance
  // 设置新的活动小部件实例
  activeComponentInstance = instance
  try {
    // 执行传入的函数并返回其结果
    return instance.scope.run(fn)
  } finally {
    // 无论是否发生异常，都恢复之前的活动小部件实例
    activeComponentInstance = preActiveWidgetRuntime
  }
}

/**
 * 获取当前组件的运行时实例
 *
 * @returns {ComponentInstance} 返回当前活跃的小部件实例
 * @throws {Error} 如果没有活跃的组件实例则抛出错误
 */
export function getInstance(): ComponentInstance
/**
 * 获取当前组件的运行时实例
 *
 * @param allowEmpty - 是否允许返回空值
 * @returns {ComponentInstance} 返回当前活跃的组件实例
 * @throws {Error} 如果没有活跃的组件实例则抛出错误
 */
export function getInstance(allowEmpty: false): ComponentInstance
/**
 * 获取当前组件的运行时实例
 *
 * @param allowEmpty - 是否允许返回空值
 * @returns {ComponentInstance | null} 返回当前活跃的组件件实例，如果没有则返回null
 */
export function getInstance(allowEmpty: true): ComponentInstance | null
/**
 * 获取当前组件的运行时实例
 *
 * @param [allowEmpty=false] - 是否允许返回空值
 * @returns {ComponentInstance | null} 返回当前活跃的组件实例，如果没有则返回null
 * @throws {Error} 如果没有活跃的组件实例
 */
export function getInstance(allowEmpty: boolean = false): ComponentInstance | null {
  if (!allowEmpty && !activeComponentInstance) {
    throw new Error('[getInstance()] No active component instance found.')
  }
  return activeComponentInstance
}

/**
 * 获取当前组件对应的视图
 *
 * @returns {ComponentView} 返回当前活跃的组件视图
 * @throws {Error} 如果没有活跃的组件实例则抛出错误
 */
export function getComponentView(): ComponentView
/**
 * 获取当前组件对应的视图
 *
 * @param allowEmpty - 是否允许返回空值
 * @returns {ComponentView} 返回当前活跃的组件视图
 * @throws {Error} 如果没有活跃的组件实例则抛出错误
 */
export function getComponentView(allowEmpty: false): ComponentView
/**
 * 获取当前组件对应的视图
 *
 * @param [allowEmpty=false] - 是否允许返回空值
 * @returns {ComponentView | null} 返回当前活跃的组件视图，如果没有返回null
 */
export function getComponentView(allowEmpty: true): ComponentView | null
/**
 * 获取当前组件对应的视图
 *
 * @param [allowEmpty=false] - 是否允许返回空值
 * @returns {ComponentView | null} 返回当前活跃的组件视图，如果没有返回null
 * @throws {Error} 如果没有活跃的组件实例且不允许返回空则抛出错误
 */
export function getComponentView(allowEmpty: boolean = false): ComponentView | null {
  if (!allowEmpty && !activeComponentInstance) {
    throw new Error('[getComponentView()] No active component instance found.')
  }
  return activeComponentInstance?.view ?? null
}

/**
 * 获取应用程序上下文的函数
 * 该函数用于从全局上下文中获取App类型的实例
 *
 * @template T - 应用程序实例的类型，默认为App
 * @returns {App | null} 返回App类型的实例，如果不存在则返回undefined
 */
export function getApp<T extends App = App>(): T | null {
  return activeComponentInstance ? (activeComponentInstance.app as T) : null
}

export { getInstance as useInstance, getComponentView as useView }
