import { isProxy, type PropName, type ProxySymbol } from '../variable'
import { isAsyncFunction } from '../../utils'
import type { AnyFunction } from '../../types/common'

/**
 * 依赖集合
 *
 * 键为代理对象，值为引用的键set集合
 */
type Deps = Map<ProxySymbol, Set<PropName>>
/** 收集结果 */
type Result = {
  /** 函数执行结果 */
  result: any
  /** 依赖集合 */
  deps: Deps
}

/**
 * # 依赖变量收集
 *
 * 该类用于收集闭包函数对响应式变量的依赖。
 *
 * 依赖收集过程，会自动收集依赖，一般无需手动调用{@link track}方法。
 */
export class Depend {
  // 收集器集合
  static #collectors = new Map<symbol, Deps>()

  /**
   * ## 跟踪依赖，记录引用
   *
   * > **注意**：依赖收集过程，会自动收集依赖，一般无需手动调用{@link track}方法。
   * 如果你使用的是代理对象本身，而不是使用的其属性，请使用{@link track}方法手动跟踪依赖。
   *
   *
   * @param proxy 代理对象
   * @param prop 属性
   */
  static track(proxy: ProxySymbol, prop: PropName): void {
    if (!isProxy(proxy)) return
    if (this.#collectors.size) {
      // 遍历收集器，并记录引用
      this.#collectors.forEach(collector => {
        if (collector.has(proxy)) {
          // 如果已经添加了该代理对象的依赖，则只添加键
          collector.get(proxy)!.add(prop)
        } else {
          // 否则添加代理对象和键
          const keys: Set<PropName> = new Set([prop])
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
   * 请勿传入异步函数，如果需要收集异步函数的依赖请使用{@link asyncCollect}方法。
   *
   * @alias get
   * @param {Function} fn 任意可执行的函数。
   * @returns { Deps } `Map对象`，键为依赖的根代理对象，值为引用的键索引`Set对象`，存在`.`连接符代表多层引用
   */
  static collect(fn: () => any): Result {
    return this.#beginCollect(fn) as Result
  }

  /**
   * ## 收集函数依赖，collect方法的别名
   *
   * @alias collect
   * @see collect
   */
  static get(fn: () => any): Result {
    return this.collect(fn)
  }

  /**
   * ## 同步收集异步函数依赖
   *
   * @param fn
   * @returns { Promise<Deps> }
   */
  static asyncCollect(fn: () => Promise<any>): Promise<Result> {
    return this.#beginCollect(fn)
  }

  /**
   * ## 开始收集
   *
   * @param fn
   * @private
   */
  static #beginCollect<T extends AnyFunction>(
    fn: T
  ): ReturnType<T> extends Promise<any> ? Promise<Result> : Result {
    // 创建临时依赖id
    const id = Symbol('id')
    // 创建依赖集合
    const deps: Deps = new Map()
    // 添加收集器
    this.#collectors.set(id, deps)
    if (isAsyncFunction(fn)) {
      return fn()
        .then((result: any) => {
          return { result, deps }
        })
        .finally(() => {
          this.#collectors.delete(id)
        })
    }
    let result
    try {
      result = fn()
    } catch (e) {
      // 捕获并记录函数执行过程中的异常
      console.error('Error in function execution:', e)
    } finally {
      // 删除收集器
      this.#collectors.delete(id)
    }
    // 返回依赖集合
    return { result, deps } as any
  }
}

/**
 * ## 跟踪依赖
 *
 * @remarks
 * 该方法是`Depend.track`方法的助手函数，可用于手动跟踪依赖
 *
 * @param proxy 代理对象
 * @param prop 属性
 * @see Depend.track
 */
export function track(proxy: ProxySymbol, prop: PropName): void {
  Depend.track(proxy, prop)
}

/**
 * ## 收集依赖
 *
 * @remarks
 * 该方法是`Depend.collect`方法的助手函数，可用于手动跟踪依赖
 *
 * @param fn - 可执行函数
 * @see Depend.collect
 */
export function collect(fn: () => any) {
  return Depend.collect(fn)
}

/**
 * ## 收集异步函数依赖
 *
 * @remarks
 * 该方法是`Depend.collect`方法的助手函数，可用于手动跟踪依赖
 *
 * @param fn - 可执行的异步函数
 * @see Depend.asyncCollect
 */
export function asyncCollect(fn: () => Promise<any>): Promise<Result> {
  return Depend.asyncCollect(fn)
}
