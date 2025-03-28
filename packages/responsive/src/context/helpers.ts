import type { AsyncContextTask, RestoreContext, Tag } from './context'
import { Context } from './context'

/**
 * Context.set方法的助手函数
 *
 * 创建一个新的上下文并返回恢复函数
 *
 * @template T - 上下文对象的类型
 * @param {Tag} tag - 上下文标签
 * @param {T} ctx - 要设置的上下文对象
 * @param {boolean} [backup=true] - 是否备份当前上下文
 * @returns {RestoreContext} 用于恢复上下文的函数
 * @example
 * const restore = createContext('user', { id: 123 })
 * // 使用上下文...
 * restore() // 恢复或删除上下文
 */
export function createContext<T extends object>(
  tag: Tag,
  ctx: T,
  backup: boolean = true
): RestoreContext {
  return Context.set(tag, ctx, backup)
}

/**
 * Context.get方法的助手函数
 *
 * 获取指定标签的上下文对象
 *
 * @template T - 上下文对象的类型
 * @param {Tag} tag - 上下文标签
 * @returns {T|undefined} 找到的上下文对象，如果不存在则返回undefined
 * @example
 * const userCtx = getContext('user')
 * console.log(userCtx?.id) // 123
 */
export function getContext<T extends object>(tag: Tag): T | undefined {
  return Context.get<T>(tag)
}

/**
 * Context.unset方法的助手函数
 * 删除指定标签的上下文
 * @param {Tag} tag - 上下文标签
 * @param {object} [ctx] - 可选的要卸载的上下文对象
 * @returns {boolean} 是否卸载成功
 * @example
 * removeContext('user') // 删除用户上下文
 */
export function removeContext(tag: Tag, ctx?: object): boolean {
  return Context.unset(tag, ctx)
}

/**
 * Context.run方法的助手函数
 *
 * 在指定上下文中同步执行函数
 *
 * @template R - 函数返回值的类型
 * @param {Tag} tag - 上下文标签
 * @param {object} ctx - 要设置的上下文对象
 * @param {() => R} fn - 要在上下文中运行的函数
 * @returns {R} 函数的执行结果
 * @example
 * const result = runInContext('user', { id: 123 }, () => {
 *   // 在此函数中可以访问用户上下文
 *   return getContext('user')?.id
 * })
 */
export function runInContext<R>(tag: Tag, ctx: object, fn: () => R): R {
  return Context.run(tag, ctx, fn)
}

/**
 * Context.withAsyncContext方法的助手函数
 * 在异步任务中管理上下文
 * @async
 * @template T - 异步任务的返回值类型
 * @param {AsyncContextTask<T>} asyncTask - 需要执行的异步任务
 * @param {Tag[]} [tags=[]] - 需要挂起的上下文标签数组
 * @returns {Promise<T>} 异步任务的执行结果
 * @example
 * await withAsyncContext(async () => {
 *   // 在此函数中指定的上下文被挂起
 *   return fetchData()
 * }, ['user'])
 */
export async function withAsyncContext<T>(
  asyncTask: AsyncContextTask<T>,
  tags: Tag[] = []
): Promise<T> {
  return Context.withAsyncContext(asyncTask, tags)
}

/**
 * Context.clear方法的助手函数
 *
 * 清除所有上下文
 *
 * @example
 * clearAllContexts() // 清除所有上下文状态
 */
export function clearAllContexts(): void {
  Context.clear()
}

/**
 * Context.tags属性的助手函数
 *
 * 获取当前所有活跃上下文标签
 *
 * @returns {IterableIterator<Tag>} 当前所有上下文标签的迭代器
 * @example
 * for (const tag of getAllContextTags()) {
 *   console.log(tag)
 * }
 */
export function getAllContextTags(): IterableIterator<Tag> {
  return Context.tags
}

/**
 * Context.size属性的助手函数
 * 获取当前存储的上下文数量
 * @returns {number} 当前存储的上下文数量
 * @example
 * const count = getContextCount()
 */
export function getContextCount(): number {
  return Context.size
}
