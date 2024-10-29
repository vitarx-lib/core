import { Depend, ExtractProp, isProxy, PropName } from '../variable'
import { AnyCallback, AnyFunction, AnyObject, AnyPrimitive } from '../../types/common'
import Listener from './listener.js'
import Observers, { Options } from './observers.js'
import { deepClone, isArray, isFunction } from '../../utils'

// 提取监听源
type ExtractOrigin<T> = T extends AnyFunction ? ReturnType<T> : T
// 提取属性名称 联合类型
type ExtractPropName<T, O = ExtractOrigin<T>> = O extends object ? ExtractProp<O> : never
/** 监听变化的回调，不需要在意旧值，只关心变化的属性 */
export type WatchChangeCallback<T> = (prop: ExtractPropName<T>[], origin: ExtractOrigin<T>) => void
/** 监听新值和旧值的回调-如果值为对象会深度克隆 */
export type WatchValueCallback<T> = (newValue: ExtractOrigin<T>, oldValue: ExtractOrigin<T>) => void
// 回调函数类型
type WatchCallback<T> = T extends AnyFunction
  ? ReturnType<T> extends AnyPrimitive
    ? WatchValueCallback<T> // 则利用依赖收集监听属性
    : WatchChangeCallback<T> // 如果不是代理对象且不是包含代理对象的数组则不进行监听
  : WatchChangeCallback<T>
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
    callback(oldValue as any, newValue as any)
    oldValue = newValue
  }, options?.limit ?? 0)
}

/**
 * ## 监听对象的所有属性变化
 *
 * 简单示例：
 *
 * ```ts
 * import { watch,reactive,ref } from 'vitarx'
 * const reactiveObj = reactive({a:1,b:2,c:{a:1}})
 * const refObj = ref({a:1})
 *
 * // ## 监听对象所有属性变化，下面的写法等效于 watch(()=>reactiveObj,...)
 * watch(reactiveObj,(props:Array<keyof obj>,origin:Reactive<typeof obj>)=>{
 *  // origin 参数为obj本身
 *  // props 为变化的属性名数组，当options.batch为false时，props一次只会存在一个属性，为true时会存在多个属性名
 *  console.log(`捕获到obj属性变化：${props.join(',')}`)
 * })
 *
 * // ## 监听嵌套对象的变化
 * watch(reactiveObj.c,...)
 *
 * // ## 监听普通值属性，下面的写法等效于 watchPropValue(reactiveObj,'a',...)
 * watch(()=>reactiveObj.a,(newValue,oldValue)=>{
 *    // 第一个参数为新值，第二个参数为旧值
 * })
 *
 * // ## 同时监听多个对象
 * watch([reactiveObj,refObj],function(index:`${number}`[],origin){
 *    // 注意： index参数值是变化的对象所在下标，例如：['0','1'] 则代表reactiveObj和refObj都发生了改变
 *    // origin 是[reactiveObj,refObj]
 * })
 * ```
 *
 * @param origin - 监听源，一般是`ref`|`reactive`创建的对象
 * @param callback - 回调函数或监听器实例
 * @param options - 监听器配置选项
 */
export function watch<T extends AnyObject, C extends WatchCallback<T>>(
  origin: T,
  callback: C,
  options?: Options
): Listener<C> {
  if (isProxy(origin)) {
    return Observers.register(origin, callback, Observers.ALL_CHANGE_SYMBOL, options)
  }
  if (isFunction(origin)) {
    const result = origin()
    // 处理监听普通类型
    if (result === null || typeof result !== 'object') {
      const { deps } = Depend.collect(origin)
      // 如果只有一个依赖，则进行监听
      if (deps.size === 1 && deps.values().next().value!.size === 1) {
        const obj = deps.keys().next().value!
        const prop = deps.values().next().value!.values().next().value!
        return watchPropValue(obj, prop, callback as AnyCallback, options) as unknown as Listener<C>
      }
      throw new TypeError(
        '当watch.origin参数为()=>any类型时，返回的非对象类型值，必须是某个响应式对象(Ref|Reactive)的属性值才能进行监听。'
      )
    } else {
      origin = result
    }
  }
  if (isArray(origin)) {
    if (origin.length === 0) {
      throw new TypeError(
        'watch.origin参数不能是空数组(包括使用getter函数返回空数组)。正确示例：watch([RefObjOrReactiveObj,...],...)'
      )
    }
    const deps = origin.filter(isProxy)
    if (deps.length === 0 || deps.length !== origin.length) {
      throw new TypeError(
        'watch.origin参数传入数组时，数组中的元素必须是响应式对象(Ref|Reactive)。正确示例：watch([refObj,reactiveObj,...],...)'
      )
    } else {
      const listener = Observers.register(deps, callback, Observers.ALL_CHANGE_SYMBOL, options)
      // 监听多个源的变化，把变化反应到listener
      Observers.registers(
        deps,
        function (p, o) {
          console.log('监听到改变')
          Observers.trigger(deps, [`${origin.indexOf(o)}`])
        },
        options
      )
      return listener
    }
  }
  throw new TypeError(
    'watch.origin参数无效，可选值示例：()=>reactiveObj.key，refObj，reactiveObj，[refObj,reactiveObj...]'
  )
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
