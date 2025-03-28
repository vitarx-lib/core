import { type AsyncContextTask, GlobalContextManager } from './index.js'
import type { RestoreContext, Tag } from './global-context-manager.js'

/**
 * 使用异步上下文
 *
 * {@link GlobalContextManager.withAsyncContext}方法的助手函数
 *
 * 此函数主要的用途是保持异步函数内上下文跟踪正常，使用此助手函数来包裹异步函数，能够使其执行完成过后自动恢复上下文。
 *
 * 强制要求异步函数小部件内必须使用该API来完成初始化的异步请求，否则会导致上下文丢失，内存泄露等风险！！！。
 *
 * ```jsx
 * import {withAsyncContext,getCurrentScope} from 'vitarx'
 * async function UserInfoCard() {
 *  // 使用withAsyncContext来保持上下文，如果不使用withAsyncContext会导致上下文丢失！！！
 *  const data = await withAsyncContext(() => fetch('/api/user-info'))
 *  console.log(getCurrentScope()) // 可以拿到作用域实例
 *  return <div>{data.name}</div>
 * }
 * ```
 *
 * @async
 * @param asyncTask - 异步任务
 * @returns {Promise} - 任务结果
 */
export function withAsyncContext<T>(asyncTask: AsyncContextTask<T>): Promise<T> {
  return GlobalContextManager.withAsyncContext(asyncTask)
}

/**
 * 获取全局上下文
 *
 * {@link GlobalContextManager.get}方法的助手函数
 *
 * @param {Tag} tag - 上下文标签
 */
export function getContext<T extends object>(tag: Tag): T | undefined {
  return GlobalContextManager.get<T>(tag)
}

/**
 * 设置全局上下文
 *
 * {@link GlobalContextManager.set} 方法的助手函数
 *
 * @param {Tag} tag - 上下文标签
 * @param {object} context - 上下文对象
 * @param {boolean} [backup = true] - 是否需要备份上下文
 * @returns {RestoreContext} - 恢复上下文的函数
 */
export function setContext<T extends object>(
  tag: Tag,
  context: T,
  backup: boolean = true
): RestoreContext {
  return GlobalContextManager.set(tag, context, backup)
}

/**
 * 卸载全局上下文
 *
 * {@link GlobalContextManager.unset} 方法的助手函数
 *
 * @param {Tag} tag - 上下文标签
 * @param {object} [ctx] - 要卸载的上下文对象，严格对比上下文是否一致
 * @returns {boolean} - 是否成功卸载上下文
 */
export function unsetContext(tag: Tag, ctx?: object): boolean {
  return GlobalContextManager.unset(tag, ctx)
}

/**
 * 为函数运行时提供上下文
 *
 * {@link GlobalContextManager.run} 方法的助手函数
 *
 * @template R - 运行结果类型
 * @param {Tag} tag - 上下文标签
 * @param {global} ctx - 上下文
 * @param {AnyFunction} fn - 运行函数
 * @returns {R} - 运行结果
 */
export function runContext<R>(tag: Tag, ctx: object, fn: () => R): R {
  return GlobalContextManager.run(tag, ctx, fn)
}
