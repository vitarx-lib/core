import {
  REF_SIGNAL_SYMBOL,
  type RefSignal,
  shallowRef,
  SIGNAL_RAW_VALUE_SYMBOL,
  SIGNAL_SYMBOL,
  Subscriber,
  type WatchOptions,
  watchProperty
} from '@vitarx/responsive'
import type { AnyProps } from '../types/index.js'

/**
 * 监听props属性变化的函数
 *
 * @template T - props类型
 * @template K - props的键类型，必须是T的键之一
 * @param {T} props - 需要监听的props对象
 * @param {K} propName - 需要监听的属性名
 * @param {Function} callback - 属性变化时的回调函数
 * @param {boolean | Omit<WatchOptions, 'scope'>} [immediateOrWatchOptions=false] - 监听选项，可以是布尔值或WatchOptions对象
 * @returns {Subscriber} 返回订阅者对象，可用于取消订阅
 */
export function onPropChange<T extends Record<string, any>, K extends keyof T>(
  props: T,
  propName: K,
  callback: (newValue: T[K], oldValue: T[K]) => void,
  immediateOrWatchOptions: boolean | Omit<WatchOptions, 'scope'> = false
): Subscriber {
  // 当前记录的“原始”旧值（用于回调）
  let oldValue = props[propName]
  const options: WatchOptions =
    typeof immediateOrWatchOptions === 'boolean'
      ? {
          immediate: immediateOrWatchOptions
        }
      : { ...immediateOrWatchOptions }
  return watchProperty(
    props,
    propName as any,
    () => {
      const newValue = props[propName]
      callback(newValue, oldValue)
      oldValue = newValue
    },
    options
  )
}

/**
 * PropModel 类实现了一个双向绑定的属性代理，用于在组件Prop和响应式系统之间建立双向数据绑定。
 *
 * 核心功能：
 * - 提供对组件Prop的响应式访问
 * - 自动处理属性更新和依赖通知
 *
 * 使用示例：
 * ```typescript
 * const props = { count: 0 }; // 模拟的组件props对象
 * const boundCount = new PropModel(props, 'count', 0);
 * boundCount.value = 10; // 会自动更新 props.count
 * ```
 *
 * 构造函数参数：
 * @param props - 目标对象，包含要绑定的属性
 * @param propName - 要绑定的属性名，必须是 _props 的键
 * @param defaultValue - 可选，当属性不存在时的默认值
 *
 * 特殊说明：
 * - 该类实现了 RefSignal 接口
 * - 会自动处理原始值是否为 RefSignal 的情况
 * - 当属性值未改变时，不会触发更新
 */
export class PropModel<T extends AnyProps, K extends keyof T, D extends T[K]>
  implements RefSignal<T[K]>
{
  readonly [REF_SIGNAL_SYMBOL] = true
  readonly [SIGNAL_SYMBOL] = true
  private readonly _ref: RefSignal
  private readonly _props: T
  private readonly _eventName: string
  constructor(props: T, propName: K, defaultValue?: D) {
    this._props = props
    this._eventName = `$onUpdate:${propName.toString()}`
    this._ref = shallowRef(props[propName])
    // 双向绑定的关键，监听属性值的变化，如果改变，则更新_ref.value
    watchProperty(props, propName as any, () => {
      if (this._ref.value !== props[propName]) {
        this._ref.value = props[propName]
      }
    })
    // 为了解决父组件传入的是 ref() , 所以初始化默认值通过 this.value 来使传入的ref更新
    if (defaultValue !== undefined && this._ref.value === undefined) this._ref.value = defaultValue
  }

  get [SIGNAL_RAW_VALUE_SYMBOL]() {
    return this._ref.value
  }

  /**
   * 获取属性的当前值
   *
   * @returns {any} 属性的当前值
   */
  get value(): D extends undefined ? T[K] : Exclude<T[K], undefined> {
    return this._ref.value
  }

  /**
   * 设置属性的新值
   *
   * 该setter会智能处理不同类型的属性值：
   * - 如果原始属性是Ref，则更新该Ref的值
   * - 如果原始属性是普通值，则直接更新属性并通知依赖
   *
   * @param {any} newValue - 要设置的新值
   */
  set value(newValue: T[K]) {
    // 如果新值和旧值相同，则不进行更新
    if (newValue === this._ref.value) return
    this._ref.value = newValue
    this._notify(newValue)
  }

  /**
   * 私有方法：通知属性值的变化
   * @param newValue 新的属性值，类型为泛型T的键K对应的类型
   */
  private _notify(newValue: T[K]) {
    // 私有方法，接收一个泛型参数newValue
    this._props[this._eventName](newValue) // 通过事件名称触发事件，并将新值作为参数传递
  }
}
/**
 * 创建一个支持双向绑定的属性引用
 *
 * 该函数用于创建一个特殊的Ref对象，它可以与组件的props属性进行双向绑定。
 * 当通过该`.value`修改值时，会智能地更新原始props中的对应属性或Ref。
 *
 * 主要特性：
 * 1. 如果原始props中的属性传入的是RefSignal，则直接更新该Ref的值
 * 2. 如果原始props中的属性是普通值，则更新该属性并通知依赖更新
 * 3. 提供与普通Ref一致的接口，可无缝集成到响应式系统中
 *
 * @template T - props对象的类型
 * @template K - 属性名的类型
 * @param {T} props - 组件的props对象
 * @param {K} propName - 需要进行双向绑定的属性名
 * @param {T[K]} [defaultValue] - 可选，当属性不存在时的默认值
 * @returns {RefSignal} 返回一个支持双向绑定的Ref对象
 *
 * @example
 * ```jsx
 * // 在组件中使用
 * function MyInput(props: { value: string) {
 *   const valueRef = usePropModel(props, 'value')
 *
 *   const handleChange = (e: Event) => {
 *     // 修改valueRef.value会自动更新props.value或其对应的Ref
 *     valueRef.value = e.target.value
 *   }
 *
 *   return <input value={valueRef} onInput={handleChange} />
 * }
 *
 * // 使用组件
 * function App() {
 *   const value = ref('initial')
 *   watch(value,(newValue)=>{
 *     console.log('value changed:', newValue)
 *   })
 *   return <MyInput value={value}/>
 * }
 * ```
 * @see {@linkcode PropModel} - 实现双向绑定的属性代理的类
 */
export function usePropModel<T extends AnyProps, K extends keyof T, D extends T[K]>(
  props: T,
  propName: K,
  defaultValue?: D
): PropModel<T, K, D> {
  return new PropModel(props, propName, defaultValue)
}

/**
 * useModel
 *
 * useModel 是 usePropModel 的别名，对齐 vue 的 useModel 命名
 */
export { usePropModel as useModel }
