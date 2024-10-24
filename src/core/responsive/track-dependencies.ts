import { Index, isProxy } from './proxy'
import { isAsyncFunction, unique_id } from '../utils'
import { CHANGE_EVENT_SYMBOL, type EventName, indexToEvent } from './watch.js'

/**
 * 依赖集合
 *
 * 键为代理对象，值为引用的键set集合
 */
type Deps = Map<Vitarx.Proxy, Set<EventName>>
type Result = {
  result: any
  deps: Deps
}

/**
 * 依赖收集器
 */
export class Dep {
  // 收集器集合
  static #collectors = new Map<string, Deps>()

  /**
   * ## 记录引用
   *
   * > **注意**：依赖收集过程，会自动收集依赖，一般无需手动调用{@link track}方法。
   * 如果你使用的是代理对象本身，而不是使用的其属性，请使用{@link track}方法手动跟踪依赖。
   *
   *
   * @param proxy 代理对象
   * @param index 索引，基于传入的代理对象，空数组代表索引对象本身
   */
  static track(proxy: Vitarx.Proxy, index: Index = []): void {
    if (!isProxy(proxy)) return
    if (this.#collectors.size) {
      // 遍历收集器，并记录引用
      this.#collectors.forEach((collector) => {
        if (collector.has(proxy)) {
          // 如果已经添加了该代理对象的依赖，则只添加键
          collector.get(proxy)!.add(indexToEvent(index))
        } else {
          // 否则添加代理对象和键
          const keys: Set<EventName> = new Set([indexToEvent(index)])
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
   * @param {boolean} merge 合并依赖，默认为false, 如果为true，则会把依赖索引向上合并
   * @returns { Deps } `Map对象`，键为依赖的根代理对象，值为引用的键索引`Set对象`，存在`.`连接符代表多层引用
   */
  static collect(fn: () => any, merge: boolean = false): Result {
    return this.#beginCollect(fn, merge) as Result
  }

  /**
   * 收集函数依赖，collect方法的别名
   *
   * @alias collect
   * @see collect
   */
  static get(fn: () => any, merge: boolean = false): Result {
    return this.collect(fn, merge)
  }

  /**
   * ## 同步收集异步函数依赖
   *
   * @param fn
   * @param {boolean} merge 合并依赖，默认为false, 如果为true，则会把依赖索引向上合并
   * @returns { Promise<Deps> }
   */
  static async asyncCollect(fn: () => Promise<any>, merge: boolean = false): Promise<Result> {
    return this.#beginCollect(fn, merge)
  }

  /**
   * 开始收集
   *
   * @param fn
   * @param merge
   * @private
   */
  static #beginCollect(fn: Function, merge: boolean = false): Promise<Result> | Result {
    // 创建临时依赖id
    const id = unique_id(15)
    // 创建依赖集合
    const deps: Deps = new Map()
    // 添加收集器
    this.#collectors.set(id, deps)
    if (isAsyncFunction(fn)) {
      return fn()
        .then((result: any) => {
          if (merge) {
            deps.forEach((keys, proxy) => {
              // 添加合并过后的依赖
              deps.set(proxy, mergeDepIndex(keys))
            })
          }
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
    if (merge) {
      deps.forEach((keys, proxy) => {
        // 添加合并过后的依赖
        deps.set(proxy, mergeDepIndex(keys))
      })
    }
    // 返回依赖集合
    return { result, deps }
  }
}

/**
 * ## 跟踪依赖
 *
 * @see Dep.track
 */
export function track(proxy: Vitarx.Proxy, index: Index = []): void {
  Dep.track(proxy, index)
}

/**
 * ## 合并依赖索引
 *
 * 将依赖向上合并，只保留最短的索引，因为响应式变量事件是向上冒泡的，这样能有效地减少依赖收集开销。
 *
 * ```ts
 * const deps = new Set(['a.b.c', 'a.b.d', 'a.e'])
 * console.log(mergeDepIndex(deps)) // Set(2) {"a.b", "a.e"}
 * ```
 *
 * @param { Set<EventName> } deps - 需要合并的依赖集合
 * @returns {Set<EventName>} 合并后的依赖集合
 */
export function mergeDepIndex(deps: Set<EventName>): Set<EventName> {
  // 检查是否存在 CHANGE_EVENT_SYMBOL
  if (deps.has(CHANGE_EVENT_SYMBOL)) {
    return new Set<EventName>([CHANGE_EVENT_SYMBOL])
  }
  const mergedDeps = new Set<string>()
  // 将Set转换为数组以便排序
  const depsArray = Array.from(deps as Set<string>).sort((a, b) => {
    return a.length - b.length
  })
  for (let i = 0; i < depsArray.length; i++) {
    const event = depsArray[i]
    const index = event.split('.')
    let shouldAdd = true
    while (index.length) {
      index.pop()
      if (index.length && mergedDeps.has(index.join('.'))) {
        shouldAdd = false
        break
      }
    }
    if (shouldAdd) {
      mergedDeps.add(event)
    }
  }
  return mergedDeps
}
