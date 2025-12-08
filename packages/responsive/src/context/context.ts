import type { AnyRecord } from '@vitarx/utils'
import { isPromise } from '@vitarx/utils'

export type Tag = string | symbol
export type AsyncContextTask<T> = (() => Promise<T>) | Promise<T>
/**
 * 上下文管理器接口
 *
 * 定义了上下文管理器应实现的基本功能，包括获取、设置和运行上下文
 * 可以用于依赖注入或实现自定义上下文管理器
 */
export interface IContext {
  /**
   * 存储上下文的仓库
   *
   * @readonly 不要修改它，否则会破坏上下文管理器的状态
   * @returns {ReadonlyMap<Tag, object>} 当前所有上下文的只读Map
   */
  readonly store: ReadonlyMap<Tag, object>

  /**
   * 根据标签获取对应的上下文对象
   *
   * @template T - 上下文对象的类型
   * @param {Tag} tag - 要获取的上下文标签
   * @returns {T|undefined} 找到的上下文对象，如果不存在则返回undefined
   */
  get<T = AnyRecord>(tag: Tag): T | undefined

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
  run<R>(tag: Tag, ctx: object, fn: () => R): R

  /**
   * 在异步任务中管理上下文
   *
   * @async
   * @template T - 异步任务的返回值类型
   * @param {AsyncContextTask<T>} asyncTask - 需要执行的异步任务
   * @returns {Promise<T>} 异步任务的执行结果
   * @throws {Error} 如果异步任务执行失败
   *
   * @description
   * 1. 执行异步任务前会备份所有上下文
   * 2. 任务完成后会自动恢复原来的上下文状态
   * 3. asyncTask可以是返回Promise的函数或直接传入的Promise对象
   * 4. 无论任务成功或失败，都会确保上下文状态被正确恢复
   * 5. 在 Node.js 环境中使用 AsyncLocalStorage 确保异步操作中的上下文隔离
   */
  withAsyncContext<T>(asyncTask: AsyncContextTask<T>): Promise<T>
}
let Context: IContext
if (import.meta.env?.SSR) {
  /**
   * Node.js 环境下的异步本地存储
   *
   * AsyncLocalStorage 可以在异步操作之间保持状态隔离，
   * 确保每个异步操作都有自己独立的上下文存储
   */
  const { AsyncLocalStorage: als } = await import('node:async_hooks')
  const asyncStore = new als<Map<Tag, object>>()
  Context = class ServerContext {
    static get store(): Map<Tag, object> {
      return asyncStore.getStore() ?? new Map()
    }
    static get<T = object>(tag: Tag): T | undefined {
      return this.store.get(tag) as T | undefined
    }
    static run<R>(tag: Tag, ctx: object, fn: () => R): R {
      // 克隆上下文，形成上下文隔离
      const store = new Map(this.store)
      store.set(tag, ctx)
      return asyncStore.run(store, fn)
    }
    static async withAsyncContext<T>(asyncTask: AsyncContextTask<T>): Promise<T> {
      return typeof asyncTask === 'function' ? asyncTask() : asyncTask
    }
  }
} else {
  Context = class ClientContext {
    static #store = new Map<Tag, object>()
    static get store(): ReadonlyMap<Tag, object> {
      return this.#store
    }
    static get<T = Record<string | symbol, any>>(tag: Tag): T | undefined {
      return this.#store.get(tag) as T | undefined
    }
    static run<R>(tag: Tag, ctx: object, fn: () => R): R {
      const prev = this.#store.get(tag)
      this.#store.set(tag, ctx)
      try {
        const result = fn()
        // 如果是异步函数，则等待其执行完成后删除上下文
        if (isPromise(result)) {
          result.finally(() => {
            const current = this.#store.get(tag)
            if (current === ctx) this.#store.delete(tag)
          })
        }
        return result
      } finally {
        if (prev !== undefined) this.#store.set(tag, prev)
        else this.#store.delete(tag)
      }
    }
    static async withAsyncContext<T>(asyncTask: AsyncContextTask<T>): Promise<T> {
      // 如果未指定标签，则挂起所有上下文
      const prevStore = new Map(this.#store)
      try {
        return typeof asyncTask === 'function' ? await asyncTask() : await asyncTask
      } finally {
        this.#store.clear()
        for (const [k, v] of prevStore) this.#store.set(k, v)
      }
    }
  }
}

export { Context }
