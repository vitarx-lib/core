import type { AsyncContextTask, Tag } from './context.js'
import { Context } from './context.js'

/**
 * Context.get方法的助手函数
 *
 * 获取指定标签的上下文对象
 *
 * @template T - 上下文对象的类型
 * @param {Tag} tag - 上下文标签
 * @returns {T|undefined} 找到的上下文对象，如果不存在则返回undefined
 * @example
 * ```js
 * const userCtx = getContext('user')
 * console.log(userCtx?.id) // 123
 * ```
 */
export function getContext<T extends Record<string | symbol, any>>(tag: Tag): T | undefined {
  return Context.get<T>(tag)
}

/**
 * Context.run方法的助手函数
 *
 * 在指定上下文中同步执行函数
 *
 * @alias runInContext
 * @template R - 函数返回值的类型
 * @param {Tag} tag - 上下文标签
 * @param {object} ctx - 要设置的上下文对象
 * @param {() => R} fn - 要在上下文中运行的函数
 * @returns {R} 函数的执行结果
 * @example
 * ```js
 * const result = runInContext('user', { id: 123 }, () => {
 *   // 在此函数中可以访问用户上下文
 *   return getContext('user')?.id
 * })
 * ```
 */
export function runInContext<R>(tag: Tag, ctx: object, fn: () => R): R {
  return Context.run(tag, ctx, fn)
}

export { runInContext as runContext }

/**
 * Context.withAsyncContext 方法的助手函数
 *
 * @description
 * 1. 执行异步任务前会备份所有上下文
 * 2. 任务完成后会自动恢复原来的上下文状态
 * 3. asyncTask可以是返回Promise的函数或直接传入的Promise对象
 * 4. 无论任务成功或失败，都会确保上下文状态被正确恢复
 * 5. 在 Node.js 环境中使用 AsyncLocalStorage 确保异步操作中的上下文隔离
 *
 * @async
 * @template T - 异步任务的返回值类型
 * @param {AsyncContextTask<T>} asyncTask - 需要执行的异步任务
 * @returns {Promise<T>} 异步任务的执行结果
 * @example
 * ```js
 * async function App() {
 *  // 非nodejs端必须使用withAsyncContext确保上下文有效
 *  await withAsyncContext(fetchData)
 *  getContext('user')?.id // 123
 * }
 * runInContext('user', { id: 123 }, App)
 * ```
 */
export async function withAsyncContext<T>(asyncTask: AsyncContextTask<T>): Promise<T> {
  return Context.withAsyncContext(asyncTask)
}
