import { isProxy } from './proxy'
import { isAsyncFunction, unique_id } from '../utils'

/**
 * 依赖集合
 *
 * 键为代理对象，值为引用的键set集合
 */
type Deps = Map<Vitarx.Ref<any>, Set<string | symbol | number | undefined>>

/**
 * 依赖收集器
 */
export class Dep {
  // 收集器集合
  static #collectors = new Map<string, Deps>()

  /**
   * 记录引用
   *
   * @param proxy 代理对象
   * @param key 引用的键
   */
  static track(proxy: Vitarx.Ref<any>, key?: string | symbol | number): void {
    if (!isProxy(proxy)) return
    if (this.#collectors.size) {
      // 遍历收集器，并记录引用
      this.#collectors.forEach((collector) => {
        if (collector.has(proxy)) {
          // 如果已经添加了该代理对象的依赖，则只添加键
          collector.get(proxy)!.add(key)
        } else {
          // 否则添加代理对象和键
          const keys = new Set([key])
          collector.set(proxy, keys)
        }
      })
    }
  }

  /**
   * ## 收集函数依赖
   *
   * 会执行函数，并记录其依赖的响应式对象
   *
   * > **注意**：函数执行过程中，会自动收集依赖，无需手动调用{@link track}方法。
   * 请勿传入异步函数，如果需要收集异步函数的依赖请使用{@link syncCollect}方法。
   *
   * @alias get
   * @param {Function} fn 任意可执行的函数。
   * @returns { Deps } Map对象，键为依赖对象，值为引用的键set集合
   */
  static collect(fn: () => any): Deps {
    return this.#beginCollect(fn) as Deps
  }

  /**
   * 收集函数依赖，collect方法的别名
   *
   * @alias collect
   * @see collect
   */
  static get(fn: () => any): Deps {
    return this.collect(fn)
  }

  /**
   * 同步收集异步函数依赖
   *
   * @param fn
   */
  static async asyncCollect(fn: () => Promise<any>): Promise<Deps> {
    return this.#beginCollect(fn)
  }

  /**
   * 开始收集
   *
   * @param fn
   * @private
   */
  static #beginCollect(fn: Function): Promise<Deps> | Deps {
    // 创建临时依赖id
    const id = unique_id(15)
    // 创建依赖集合
    const deps: Deps = new Map()
    // 添加收集器
    this.#collectors.set(id, deps)
    if (isAsyncFunction(fn)) {
      return fn()
        .then(() => {
          return deps
        })
        .finally(() => {
          this.#collectors.delete(id)
        })
    }
    try {
      fn()
    } catch (e) {
      // 捕获并记录函数执行过程中的异常
      console.error('Error in function execution:', e)
    } finally {
      // 删除收集器
      this.#collectors.delete(id)
    }
    // 返回依赖集合
    return deps
  }
}
