import { REF_SIGNAL_SYMBOL, SIGNAL_RAW_VALUE_SYMBOL, SIGNAL_SYMBOL } from '../constants.js'
import type { RefSignal } from '../types/index.js'
import { isRefSignal } from '../utils/index.js'

/**
 * ReadonlyRef 是一个响应式引用类，用于创建基于 getter 函数的响应式信号。
 * 它实现了 RefSignal 接口，提供了一种将普通值转换为响应式信号的方式。
 *
 * 核心功能：
 * - 将 getter 函数包装为响应式信号
 * - 每次访问时动态获取最新值
 * - 支持通过 Symbol 访问原始值
 *
 * @example
 * ```typescript
 * // 创建一个基于 getter 的引用信号
 * const ref = new ReadonlyRef(() => computeExpensiveValue());
 *
 * // 访问值
 * console.log(ref.value); // 会调用 getter 函数
 *
 * const ref2 = ReadonlyRef();
 *
 * ```
 *
 * @param _target - 一个无参数的函数，用于获取引用的值。该函数会在每次访问 value 属性时被调用
 *
 * @remarks
 * - getter 函数应该是纯函数，避免产生副作用
 * - 每次访问 value 属性都会调用 getter，因此不适合用于计算成本高的操作
 * - 该类是只读的，不支持直接设置值
 */
export class ReadonlyRef<T> implements RefSignal {
  // 使用 REF_SIGNAL_SYMBOL 标记这是一个引用信号
  readonly [REF_SIGNAL_SYMBOL] = true
  readonly [SIGNAL_SYMBOL] = true
  /**
   * 构造函数
   * @param _target - 一个无参数的函数，用于获取引用的值
   */
  constructor(private readonly _target: (() => T) | RefSignal<T> | T) {
    if (typeof _target === 'function') {
      Object.defineProperty(this, 'value', {
        get: () => {
          return (this._target as () => T)()
        }
      })
    } else if (isRefSignal(_target)) {
      Object.defineProperty(this, 'value', {
        get: () => {
          return (this._target as RefSignal<T>).value
        }
      })
    }
  }

  /**
   * 获取信号的原始值
   * 通过 Symbol 属性访问，确保值的获取是响应式的
   * @returns T - 返回引用的原始值
   */
  get [SIGNAL_RAW_VALUE_SYMBOL](): T {
    return this.value
  }
  /**
   * 获取引用的值
   * 每次访问都会调用 getter 函数获取最新值
   * @returns T - 返回引用的当前值
   */
  get value(): T {
    return this._target as T
  }
}

/**
 * 创建一个只读的引用对象
 *
 * @template T - 目标值的类型
 * @param {T | (() => T) | RefSignal<T>} target - 目标值或返回目标值的函数或RefSignal对象
 * @returns { ReadonlyRef } 返回一个ReadonlyRef对象，该对象提供了对目标值的只读访问
 * @see {@link ReadonlyRef}
 */
export function readonlyRef<T>(target: (() => T) | RefSignal<T> | T): ReadonlyRef<T> {
  return new ReadonlyRef(target)
}

/**
 * 检查给定的值是否为 ReadonlyRef 类型
 * @param val 需要检查的值
 * @returns 如果是 ReadonlyRef 类型返回 true，否则返回 false
 */
export function isReadonlyRef(val: any): val is ReadonlyRef<any> {
  return val && val instanceof ReadonlyRef // 检查值是否存在并且是 ReadonlyRef 的实例
}
