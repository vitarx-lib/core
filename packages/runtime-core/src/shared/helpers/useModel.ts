import {
  IS_REF,
  IS_SIGNAL,
  onScopeDispose,
  type RefSignal,
  runEffect,
  ShallowRef,
  shallowRef
} from '@vitarx/responsive'
import type { AnyProps } from '../../types/index.js'

/**
 * ModelRef 类实现了一个双向绑定的属性代理，用于在组件Prop和响应式系统之间建立双向数据绑定。
 *
 * 核心功能：
 * - 提供对组件Prop的响应式访问
 * - 自动处理属性更新和依赖通知
 *
 * 使用示例：
 * ```typescript
 * const props = { count: 0 }; // 模拟的组件props对象
 * const boundCount = new ModelRef(props, 'count', 0);
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
export class ModelRef<T extends AnyProps, K extends keyof T> implements RefSignal<T[K]> {
  readonly [IS_REF] = true
  readonly [IS_SIGNAL] = true
  private readonly _ref: ShallowRef<T[K]>
  private readonly _props: T
  private readonly _eventName: string
  constructor(props: T, propName: K, defaultValue?: T[K]) {
    this._props = props
    this._eventName = `onUpdate:${propName.toString()}`
    this._ref = shallowRef(props[propName])
    // 双向绑定的关键，监听属性值的变化，如果改变，则更新_ref.value
    const stop = runEffect(
      () => {
        if (this._ref.value !== props[propName]) {
          this._ref.value = props[propName]
        }
      },
      { flush: 'sync', track: 'once' }
    )
    // 销毁时，清除关联
    if (stop) onScopeDispose(stop, true)
    // 初始化默认值通过 this.value 使外部变量更新
    if (arguments.length > 2 && this._ref.value === undefined) this.value = defaultValue!
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
    if (typeof this._props[this._eventName] === 'function') {
      this._props[this._eventName](newValue) // 通过事件名称触发事件，并将新值作为参数传递
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
 *   const valueRef = useModel(props, 'value')
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
 * @see {@linkcode ModelRef} - 实现双向绑定的属性代理的类
 */
export function useModel<T extends AnyProps, K extends keyof T>(
  props: T,
  propName: K,
  defaultValue?: T[K]
): ModelRef<T, K> {
  return new ModelRef(props, propName, defaultValue)
}
