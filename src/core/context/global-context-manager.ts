import { isArray, isFunction, isPromise } from '../../utils/index.js'

export type RestoreContext = () => void
export type Tag = string | symbol
export type AsyncContextTask<T> = (() => Promise<T>) | Promise<T>

/**
 * 全局上下文管理器
 */
export default class GlobalContextManager {
  // 上下文存储商店
  static #store = new Map<Tag, object>()

  /**
   * 获取当前上下文
   *
   * @param tag
   */
  static get<T extends object>(tag: Tag): T | undefined {
    return this.#store.get(tag) as T | undefined
  }

  /**
   * 上下文仓库
   *
   * 注意：不要直接修改这个 Map，否则会破坏上下文管理器的状态
   */
  static get store(): ReadonlyMap<Tag, object> {
    return this.#store
  }

  /**
   * 卸载当前上下文
   *
   * @param tag - 上下文标签
   * @param ctx - 要卸载的上下文对象，如果传入会严格对比，不传入则直接卸载当前上下文
   * @return {boolean} 是否卸载成功，仅传入了ctx时有可能返回false
   */
  static unset(tag: Tag, ctx?: object): boolean {
    if (ctx) {
      if (!this.#store.has(tag)) return true
      const current = this.#store.get(tag)
      if (current === ctx) {
        return this.#store.delete(tag)
      }
      return false
    }
    this.#store.delete(tag)
    return true
  }

  /**
   * 运行一个函数，为其提供上下文
   *
   * @template R - 运行结果类型
   * @param {Tag} tag - 上下文标签
   * @param {global} ctx - 上下文
   * @param {AnyFunction} fn - 运行函数
   * @return {R} - 运行结果
   */
  static run<R>(tag: Tag, ctx: object, fn: () => R): R {
    const restore = GlobalContextManager.set(tag, ctx, true)
    try {
      const result = fn()
      // 如果是异步函数，则等待其执行完成后删除上下文
      if (isPromise(result)) {
        result.finally(() => {
          GlobalContextManager.unset(tag, ctx)
        })
      }
      return result
    } finally {
      restore()
    }
  }

  /**
   * 在异步任务中管理上下文
   *
   * 该方法会在执行异步任务时临时挂起指定的上下文（或所有上下文），
   * 并在任务完成后自动恢复上下文状态。
   *
   * @async
   * @template T - 异步任务的返回值类型。
   * @param {() => Promise<T> | Promise<T>} asyncTask - 需要执行的异步任务，可以是一个返回 Promise 的函数或直接传入的 Promise。
   * @param {Tag[]} [tags=[]] - 需要挂起的上下文标签数组。如果未传入或为空数组，则会挂起所有上下文。
   * @returns {Promise<T>} - 异步任务的执行结果。
   * @throws {Error} - 如果异步任务执行失败，则会抛出错误。
   */
  static async withAsyncContext<T>(asyncTask: AsyncContextTask<T>, tags: Tag[] = []): Promise<T> {
    // 如果 asyncTask 是一个函数，则调用它以获取 Promise
    if (isFunction(asyncTask)) {
      asyncTask = asyncTask()
    }
    // 如果 asyncTask 不是 Promise，则直接返回
    if (!isPromise(asyncTask)) return asyncTask

    let restoreContext: () => void

    // 如果指定了需要挂起的上下文标签
    if (isArray(tags) && tags.length > 0) {
      const backup: Map<Tag, object | undefined> = new Map()
      // 备份并删除指定的上下文
      tags.forEach(tag => {
        const context = GlobalContextManager.get(tag)
        if (context !== undefined) {
          backup.set(tag, context)
          this.#store.delete(tag)
        }
      })
      // 定义恢复上下文的函数
      restoreContext = () => {
        backup.forEach((value, key) => value && this.#store.set(key, value))
        backup.clear()
      }
    } else {
      // 如果未指定标签，则挂起所有上下文
      const prevStore = this.#store
      this.#store = new Map<Tag, object>()
      restoreContext = () => (this.#store = prevStore)
    }

    try {
      // 执行异步任务并返回结果
      return await asyncTask
    } finally {
      // 无论任务成功与否，恢复上下文
      restoreContext()
    }
  }

  /**
   * 清除所有上下文
   *
   * 谨慎使用！！！
   */
  static clear(): void {
    this.#store.clear()
  }

  /**
   * 当前存储的上下文数量
   */
  static get size(): number {
    return this.#store.size
  }

  /**
   * 当前活跃的上下文标签
   */
  static get tags(): MapIterator<Tag> {
    return this.#store.keys()
  }

  /**
   * 设置当前上下文
   *
   * @param {Tag} tag - 上下文标签
   * @param {object} ctx - 上下文
   * @param {boolean} [backup = true] - 是否需要备份上下文，如果备份上下文，在还原时会自动恢复该上下文，否则为删除当前上下文
   * @returns {RestoreContext} - 还原上下文的函数
   */
  static set<T extends object>(tag: Tag, ctx: T, backup: boolean = true): RestoreContext {
    const prev = backup ? this.#store.get(tag) : undefined
    this.#store.set(tag, ctx)
    return () => {
      // 前一个上下文存在，则恢复前一个上下文，否则删除当前上下文
      if (prev) {
        this.#store.set(tag, prev)
        return true
      } else {
        return this.unset(tag, ctx)
      }
    }
  }
}
