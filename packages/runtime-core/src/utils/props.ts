import {
  isReadonlyRef,
  isRefSignal,
  REF_SIGNAL_SYMBOL,
  type RefSignal,
  shallowRef,
  SIGNAL_RAW_VALUE_SYMBOL,
  SIGNAL_SYMBOL,
  SubManager,
  Subscriber,
  toRaw,
  unref,
  type WatchOptions,
  watchProperty
} from '@vitarx/responsive'
import { isRecordObject } from '@vitarx/utils'
import { INTRINSIC_ATTRIBUTES } from '../constants/index.js'
import type { AnyProps, BindAttributes } from '../types/index.js'
import { StyleUtils } from './style.js'

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
export function onPropChange<T extends {}, K extends keyof T>(
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
export class PropModel<T extends {}, K extends keyof T> implements RefSignal<T[K]> {
  readonly [REF_SIGNAL_SYMBOL] = true
  readonly [SIGNAL_SYMBOL] = true
  private readonly _ref: RefSignal
  private readonly _props: T
  private readonly _propName: K
  constructor(props: T, propName: K, defaultValue?: T[K]) {
    this._props = props
    this._propName = propName
    this._ref = shallowRef(props[propName])
    // 双向绑定的关键，监听属性值的变化，如果改变，则更新_ref.value
    watchProperty(props, propName as any, () => {
      if (this._ref.value !== props[propName]) {
        this._ref.value = props[propName]
      }
    })
    // 为了解决父组件传入的是 ref() , 所以初始化默认值通过 this.value 来使传入的ref更新
    if (defaultValue !== undefined && this._ref.value === undefined) this.value = defaultValue
  }
  get [SIGNAL_RAW_VALUE_SYMBOL]() {
    return this._ref.value
  }
  /**
   * 获取属性的当前值
   *
   * @returns {any} 属性的当前值
   */
  get value(): T[K] {
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
    const originalProps = toRaw(this._props) as T
    const originalValue = originalProps[this._propName as keyof typeof originalProps]
    if (isRefSignal(originalValue) && !isReadonlyRef(originalValue)) {
      // 如果外部传入的原始值是一个ref，则更新ref的值
      originalValue.value = newValue
      // 通知依赖更新
      SubManager.notify(this._props, this._propName)
    }
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
export function usePropModel<T extends {}, K extends keyof T>(
  props: T,
  propName: K,
  defaultValue?: T[K]
): PropModel<T, K> {
  return new PropModel(props, propName, defaultValue)
}

/**
 * 将绑定的属性合并到目标属性对象中
 *
 * 该函数支持两种绑定格式：
 * 1. 对象形式：直接将对象属性合并到目标属性中
 * 2. 数组形式：[源对象, 排除数组]，将源对象属性合并到目标属性中，但排除指定的属性
 *
 * 对于特殊属性（style、class等）会使用特定的合并策略，
 * 对于已存在的普通属性保持不变，只添加新的属性。
 *
 * @internal 这是一个框架内部使用的工具函数
 * @param props - 目标属性对象，合并后的属性将存储在此对象中
 * @param bind - 要绑定的属性，可以是对象或 [源对象, 排除数组] 的数组形式
 */
export function bindProps(props: AnyProps, bind: BindAttributes): void {
  // ---------- Step 1: 解析绑定源与排除列表 ----------
  let source: AnyProps
  let exclude: Set<string> | null = null

  if (Array.isArray(bind)) {
    // v-bind 是数组形式： [源对象, 排除数组]
    const [src, ex] = bind as [props: AnyProps, exclude: string[]]
    if (!isRecordObject(src)) return
    source = src
    if (Array.isArray(ex) && ex.length) exclude = new Set(ex)
  } else {
    // 普通对象形式
    source = bind
  }

  // ---------- Step 2: 遍历并合并属性 ----------
  for (const [key, rawValue] of Object.entries(source)) {
    // ---- 跳过无效属性 ----
    if (
      rawValue === undefined || // 忽略 undefined 值
      INTRINSIC_ATTRIBUTES.has(key) || // 忽略固有属性（如 key/ref 等）
      (exclude && exclude.has(key)) // 忽略用户指定排除属性
    ) {
      continue
    }

    const existing = props[key] // 当前 props 中已有的值
    const value = unref(rawValue) // 解包可能的 ref/reactive 值
    // 用于定义特定属性的自定义合并逻辑
    const SPECIAL_MERGERS = {
      style: StyleUtils.mergeCssStyle,
      class: StyleUtils.mergeCssClass,
      className: StyleUtils.mergeCssClass,
      classname: StyleUtils.mergeCssClass
    } as const
    // ---- 特殊属性处理（class/style）----
    if (key in SPECIAL_MERGERS) {
      const merger = SPECIAL_MERGERS[key as keyof typeof SPECIAL_MERGERS]
      props[key] = existing
        ? merger(unref(existing), value) // 合并已有与新值
        : value // 无现值则直接使用新值
      continue
    }

    // ---- 已存在的普通属性保持不变 ----
    if (existing !== undefined) continue

    // ---- 新增普通属性 ----
    props[key] = value
  }
}
