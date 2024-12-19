import { isArray, isPromise } from '../../utils/index.js'

export type RestoreContext = () => void
export type Tag = string | symbol
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
   * 设置当前上下文
   *
   * @param {Tag} tag - 上下文标签
   * @param {object} ctx - 上下文
   * @param {boolean} [backup = true] - 是否需要备份上下文，如果备份上下文，在还原时会自动恢复该上下文，否则为删除当前上下文
   */
  static set<T extends object>(tag: Tag, ctx: T, backup: boolean = true): RestoreContext {
    const prev = backup ? this.#store.get(tag) : undefined
    this.#store.set(tag, ctx)
    return () => {
      if (backup && prev) {
        this.#store.set(tag, prev)
        return true
      } else {
        return this.unset(tag, ctx)
      }
    }
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
      if (this.#store.get(tag) === ctx) {
        return this.#store.delete(tag)
      }
      console.warn(
        `[Vitarx.GlobalContextManager.unset][WARN]：切换上下文失败，当前${tag.toString()}的上下文与要卸载的上下文不匹配，这或许是内部逻辑BUG！`
      )
      return false
    }
    this.#store.delete(tag)
    return true
  }

  /**
   * 运行上下文
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
   * 使用异步上下文
   *
   * @async
   * @param {() => Promise} fn - 要执行的异步函数
   * @param {Tag[]} [tags=[]] - 要使用的上下文标签，可选参数，默认为空数组，会挂起所有上下文，开发者一般无需使用该参数。
   * @returns {Promise} - fn函数的返回值
   * @throws {Error} - 如果fn函数执行失败，则抛出错误
   */
  static async withAsyncContext<T>(fn: () => Promise<T> | T, tags: Tag[] = []): Promise<T> {
    const result = fn()
    if (!isPromise(result)) return result
    let restoreContext: () => void
    if (isArray(tags) && tags.length > 0) {
      const backup: Map<Tag, object | undefined> = new Map()
      // 获取和删除指定 tags 的上下文，并将其备份
      tags.forEach(tag => {
        const context = GlobalContextManager.get(tag)
        if (context !== undefined) {
          backup.set(tag, context)
          this.#store.delete(tag) // 删除对应的上下文
        }
      })
      // 恢复上下文
      restoreContext = () => {
        backup.forEach((value, key) => value && this.#store.set(key, value))
        backup.clear()
      }
    } else {
      const prevStore = this.#store
      this.#store = new Map<Tag, object>()
      restoreContext = () => (this.#store = prevStore)
    }

    try {
      return await result
    } finally {
      restoreContext()
    }
  }
}
