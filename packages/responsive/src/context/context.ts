import { isArray, isFunction, isPromise } from '@vitarx/utils'

export type RestoreContext = () => void
export type Tag = string | symbol
export type AsyncContextTask<T> = (() => Promise<T>) | Promise<T>

/**
 * 上下文管理器类，用于管理应用程序中的上下文状态
 *
 * 该类提供了静态方法来设置、获取和管理上下文状态，支持同步和异步操作
 * 上下文通过标签(Tag)进行标识，可以是字符串或Symbol
 * 注意：所有方法都是静态的，不需要实例化此类
 */
export class Context {
  // 上下文存储商店
  static #store = new Map<Tag, object>()

  /**
   * 获取当前上下文仓库的只读视图
   *
   * @readonly
   * @returns {ReadonlyMap<Tag, object>} 当前所有上下文的只读Map
   * @warning 注意：不要直接修改返回的Map，否则会破坏上下文管理器的状态
   */
  static get store(): ReadonlyMap<Tag, object> {
    return this.#store
  }

  /**
   * 获取当前存储的上下文数量
   *
   * @readonly
   * @returns {number} 当前存储的上下文数量
   */
  static get size(): number {
    return this.#store.size
  }

  /**
   * 获取当前所有活跃上下文标签的迭代器
   *
   * @readonly
   * @returns {MapIterator<Tag>} 当前所有上下文标签的迭代器
   */
  static get tags(): MapIterator<Tag> {
    return this.#store.keys()
  }

  /**
   * 根据标签获取对应的上下文对象
   *
   * @template T - 上下文对象的类型
   * @param {Tag} tag - 要获取的上下文标签
   * @returns {T|undefined} 找到的上下文对象，如果不存在则返回undefined
   */
  static get<T = Record<string | symbol, any>>(tag: Tag): T | undefined {
    return this.#store.get(tag) as T | undefined
  }

  /**
   * 卸载指定标签的上下文
   *
   * @param {Tag} tag - 要卸载的上下文标签
   * @param {object} [ctx] - 可选的要卸载的上下文对象，如果传入会严格对比
   * @returns {boolean} 是否卸载成功
   *
   * @description
   * 1. 如果只传入tag参数，则直接删除该标签对应的上下文
   * 2. 如果同时传入tag和ctx参数，则只有在当前上下文与传入的ctx严格相等时才会删除
   * 3. 返回值说明：
   *    - 仅传入tag时总是返回true
   *    - 同时传入tag和ctx时，只有在成功删除时返回true
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
   * 在指定上下文中运行一个函数
   *
   * @template R - 函数返回值的类型
   * @param {Tag} tag - 上下文标签
   * @param {object} ctx - 要设置的上下文对象
   * @param {() => R} fn - 要在上下文中运行的函数
   * @returns {R} 函数的执行结果
   *
   * @description
   * 1. 在执行函数前设置指定的上下文
   * 2. 函数执行完成后自动恢复之前的上下文状态
   * 3. 如果函数返回Promise，则会在Promise完成后自动删除该上下文
   * 4. 无论函数执行成功或失败，都会确保上下文状态被正确恢复
   */
  static run<R>(tag: Tag, ctx: object, fn: () => R): R {
    const restore = this.set(tag, ctx, true)
    try {
      const result = fn()
      // 如果是异步函数，则等待其执行完成后删除上下文
      if (isPromise(result)) {
        result.finally(() => this.unset(tag, ctx))
      }
      return result
    } finally {
      restore()
    }
  }

  /**
   * 在异步任务中管理上下文
   *
   * @async
   * @template T - 异步任务的返回值类型
   * @param {AsyncContextTask<T>} asyncTask - 需要执行的异步任务
   * @param {Tag[]} [tags=[]] - 需要挂起的上下文标签数组，不传入则会挂起所有上下文
   * @returns {Promise<T>} 异步任务的执行结果
   * @throws {Error} 如果异步任务执行失败
   *
   * @description
   * 1. 执行异步任务前会临时挂起指定的上下文（或所有上下文）
   * 2. 任务完成后会自动恢复原来的上下文状态
   * 3. 如果tags参数为空数组，则会挂起所有上下文
   * 4. asyncTask可以是返回Promise的函数或直接传入的Promise对象
   * 5. 无论任务成功或失败，都会确保上下文状态被正确恢复
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
        const context = this.get(tag)
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
   * @warning 谨慎使用！此操作会清除所有上下文状态
   */
  static clear(): void {
    this.#store.clear()
  }

  /**
   * 设置指定标签的上下文
   *
   * @template T - 上下文对象的类型
   * @param {Tag} tag - 上下文标签
   * @param {T} ctx - 要设置的上下文对象
   * @param {boolean} [backup=true] - 是否备份当前上下文
   * @returns {RestoreContext} 用于恢复上下文的函数
   *
   * @description
   * 1. 如果backup为true，会备份当前上下文，并在调用返回的恢复函数时恢复
   * 2. 如果backup为false，调用恢复函数时会直接删除该上下文
   * 3. 返回的恢复函数可以多次调用，但只有第一次调用会生效
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
