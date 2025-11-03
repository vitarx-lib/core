import { getContext, runInContext } from '@vitarx/responsive'
import type { App } from './app.js'

const APP_CONTEXT_SYMBOL = Symbol('APP_CONTEXT_SYMBOL')
/**
 * 在应用程序上下文中执行函数
 * @param app 应用程序实例
 * @param fn 需要在应用上下文中执行的函数
 * @returns {any} 函数执行后的返回值
 */
export const runInAppContext = <R>(app: App, fn: () => R): R => {
  // 使用APP_CONTEXT_SYMBOL作为上下文标识符，在指定应用上下文中执行函数
  return runInContext(APP_CONTEXT_SYMBOL, app, fn)
}
/**
 * 获取应用程序上下文的函数
 * 该函数用于从全局上下文中获取App类型的实例
 *
 * @template T - 应用程序实例的类型，默认为App
 * @returns {App | undefined} 返回App类型的实例，如果不存在则返回undefined
 */
export const getAppContext = <T extends App = App>(): T | undefined => {
  // 调用getContext函数，传入APP_CONTEXT_SYMBOL作为key，并指定返回类型为App
  return getContext<T>(APP_CONTEXT_SYMBOL)
}
export { getAppContext as useAppContext }
