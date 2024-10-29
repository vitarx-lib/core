import { ExtractProp, PropName } from '../variable'
import { AnyCallback, AnyObject } from '../../types/common'
import Listener from './listener.js'
import Observers, { Options } from './observers.js'
import { deepClone, isFunction } from '../../utils'

/** 监听新值和旧值的回调-如果值为对象会深度克隆 */
export type WatchValueCallback<T> = (newValue: T, oldValue: T) => void

/**
 * ## 回调函数类型
 *
 * 如果监听的是对象，则prop为变化的属性名数组，如果监听的是对象属性，则prop为变化的属性名称（单个属性名）
 *
 * @template P - 监听的属性名类型
 * @template T - 监听源类型
 * @param {any} prop - 属性名
 */
export type Callback<P extends PropName | PropName[], T extends AnyObject> = (
  prop: P,
  origin: T
) => void

/**
 * 创建值监听器
 *
 * @param origin
 * @param prop
 * @param callback
 * @param options
 * @private
 */
function createValueListener<T extends AnyObject>(
  origin: T,
  prop: ExtractProp<T> | undefined,
  callback: WatchValueCallback<T>,
  options?: Options
): Listener<() => void> {
  let oldValue = deepClone(prop !== undefined ? origin[prop] : origin)
  return new Listener(function () {
    const newValue = deepClone(prop !== undefined ? origin[prop] : origin)
    callback(oldValue, newValue)
    oldValue = newValue
  }, options?.limit ?? 0)
}

/**
 * ## 监听对象的所有属性变化
 *
 * @param origin - 监听源，一般是`ref`|`reactive`创建的对象
 * @param callback - 回调函数或监听器实例
 * @param options - 监听器配置选项
 */
export function watch<T extends AnyObject, C extends AnyCallback = Callback<ExtractProp<T>[], T>>(
  origin: T,
  callback: C | Listener<C>,
  options?: Options
): Listener<C> {
  return Observers.register(origin, callback, Observers.ALL_CHANGE_SYMBOL, options)
}

/**
 * ## 监听多个属性变化
 *
 * 该方法和watchProp不同的是，可以监听多个属性的变化，当监听多个属性时，回调函数的参数为变化的属性名数组。
 *
 * @param origin - 监听源，一般是`ref`|`reactive`创建的对象
 * @param props - 要监听的属性名数组
 * @param callback - 回调函数或监听器实例
 * @param options - 监听器配置选项
 */
export function watchProps<
  T extends AnyObject,
  P extends ExtractProp<T>[],
  C extends AnyCallback = Callback<P, T>
>(origin: T, props: P, callback: C | Listener<C>, options?: Options): Listener<C> {
  let onProps = new Set(props)
  const func = isFunction(callback)
  const limit = options?.limit ?? 0
  let count: number = 0
  const listener = new Listener(function (prop: any[], origin) {
    const change = prop.filter(item => onProps.has(item))
    if (change.length) {
      if (func) {
        callback(change, origin)
        count++
        if (count >= limit) {
          listener.destroy()
        }
      } else {
        // 触发用户监听器，如果销毁了则删除代理监听器
        const result = listener.trigger([change, origin])
        if (!result) listener.destroy()
      }
    }
  }, 0)
  return Observers.register(origin, listener as Listener<C>, Observers.ALL_CHANGE_SYMBOL, options)
}

/**
 * ## 监听单个属性变化
 *
 * @param origin - 监听源，一般是`ref`|`reactive`创建的对象
 * @param prop - 要监听的属性名
 * @param callback - 回调函数或监听器实例
 * @param options - 监听器配置选项
 */
export function watchProp<
  T extends AnyObject,
  P extends ExtractProp<T>,
  C extends AnyCallback = Callback<P, T>
>(origin: T, prop: P, callback: C | Listener<C>, options?: Options): Listener<C> {
  return Observers.register(origin, callback, prop, options)
}

/**
 * ## 监听单个属性变化
 *
 * 不同于`watchProp`方法，`watchPropValue`方法的回调参数为新值和旧值，而`watchProp`回调参数为属性名称，和源对象。
 *
 * @param origin - 监听源，一般是`ref`|`reactive`创建的对象
 * @param prop - 要监听的属性名
 * @param callback - 回调函数，第一个参数为`newValue`，第二个参数为`oldValue`
 * @param options - 监听器配置选项
 */
export function watchPropValue<T extends AnyObject, P extends ExtractProp<T>>(
  origin: T,
  prop: P,
  callback: WatchValueCallback<T[P]>,
  options?: Options
): Listener<() => void> {
  return Observers.register(
    origin,
    createValueListener(origin, prop, callback, options),
    prop,
    options
  )
}

/**
 * ## 监听对象改变
 *
 * 不同于`watch`方法，该方法会回调对象改变之后和改变之前的值做为参数，且深度克隆。
 *
 * @param origin - 监听源，一般是`ref`|`reactive`创建的对象
 * @param callback - 回调函数，第一个参数为`newValue`，第二个参数为`oldValue`
 * @param options - 监听器配置选项
 */
export function watchValue<T extends AnyObject>(
  origin: T,
  callback: WatchValueCallback<T>,
  options?: Options
): Listener<() => void> {
  return Observers.register(
    origin,
    createValueListener(origin, undefined, callback, options),
    Observers.ALL_CHANGE_SYMBOL,
    options
  )
}
