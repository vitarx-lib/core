import { IS_REF, type Ref, ShallowRef, shallowRef, watch } from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import type { AnyProps } from '../types/index.js'

export type WithModelEvent<T extends AnyProps, K extends keyof T> = T & {
  [key in K extends string ? `onUpdate:${K}` : never]?: (value: T[K]) => void
}

/**
 * ModelRef 类实现了一个双向绑定的属性代理，用于在组件Prop和响应式系统之间建立双向数据绑定。
 *
 * 核心功能：
 * - 提供对组件Prop的响应式访问
 * - 自动处理属性更新和依赖通知
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
export class ModelRef<T extends AnyProps, K extends keyof T, V extends T[K]> implements Ref<
  V extends void ? T[K] : Exclude<T[K], void>
> {
  readonly [IS_REF] = true
  private readonly _ref: ShallowRef<V extends void ? T[K] : Exclude<T[K], void>>
  private readonly _props: T
  private readonly _eventName: string
  constructor(props: T, propName: K, defaultValue?: T[K]) {
    this._props = props
    this._eventName = `onUpdate:${propName.toString()}`
    this._ref = shallowRef(props[propName])
    // 双向绑定的关键，监听属性值的变化，如果改变，则更新_ref.value
    watch(
      () => props[propName],
      newValue => {
        if (this._ref.value !== newValue) this._ref.value = newValue
      },
      { flush: 'sync' }
    )
    // 初始化默认值通过 this.value 使外部变量更新
    if (arguments.length > 2 && this._ref.value === undefined) this.value = defaultValue!
  }

  /**
   * 获取属性的当前值
   *
   * @returns {any} 属性的当前值
   */
  get value(): V extends void ? T[K] : Exclude<T[K], void> {
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
      // 通过事件名称触发事件，并将新值作为参数传递
      try {
        this._props[this._eventName](newValue)
      } catch (e) {
        logger.error(`[ModelRef] ${this._eventName} call failed`, e)
      }
    }
  }
}
/**
 * 创建一个支持双向绑定的属性引用
 *
 * 该函数用于创建一个特殊的 `ModelRef` 对象，它可以与组件的props属性进行双向绑定。
 * 当通过该`.value`修改值时，会自动触发 `onUpdate:propName` 事件。
 *
 * @template T - props对象的类型
 * @template K - 属性名的类型
 * @template V - 属性值的类型
 * @param {T} props - 组件的props对象
 * @param {K} propName - 需要进行双向绑定的属性名
 * @param {V} [defaultValue] - 可选，当属性不存在时的默认值
 * @returns { ModelRef } 返回一个 `ModelRef` 实例
 *
 * @example
 * ```jsx
 * import { ref, watch } from 'vitarx'
 * import { useModel, type WithModelEvent } from 'vitarx'
 *
 * interface MyInputProps {
 *   // modelValue 是 v-model 指令约定的属性名，无需显式声明更新事件
 *   modelValue: string
 *   // 自定义属性，需要显式声明更新事件
 *   customValue: string
 *   // 为 customValue 属性声明更新事件
 *   'onUpdate:customValue': (v: string) => void
 * }
 *
 * // 包装一个支持双向绑定的输入组件
 * function MyInput(props: MyInputProps) {
 *   const valueRef = useModel(props, 'modelValue')
 *   const customValueRef = useModel(props, 'customValue')
 *
 *   return <>
 *     <input value={valueRef.value} onInput={(e) => valueRef.value = e.target.value} />
 *     <input value={customValueRef.value} onInput={(e) => customValueRef.value = e.target.value} />
 *   </>
 * }
 *
 * // 在Props中显式声明更新事件不美观，可以使用 WithModelEvent 类型工具来简化
 * export type MyInputProps = WithModelEvent<{
 *   modelValue: string
 *   customValue: string
 * }, 'customValue'>
 * // 或者
 * function MyInput(props: WithModelEvent<MyInputProps, 'customValue'>){//...}
 *
 *
 * // 使用组件
 * function App() {
 *   const value = ref('initial')
 *   const customValue = ref('initial')
 *   watch(value,(newValue)=>{
 *     console.log('value changed:', newValue)
 *   })
 *   watch(customValue, (newValue) => {
 *     console.log('customValue changed:', newValue)
 *   })
 *   return <MyInput v-model={value} onUpdate:customValue={customValue} />
 * }
 *
 * // 巧用小妙招
 * function Foo(props: {show?: boolean}) {
 *
 *   const visible = useModel(props, 'show', false)
 *
 *   // 通过 useModel 来绕过 props 的只读限制
 *   return <div>
 *     {visible.value ? 'visible' : 'hidden'}
 *     <button onClick={() => { visible.value = !visible.value }}>Toggle</button>
 *   </div>
 * }
 * ```
 * @see {@linkcode ModelRef} - 实现双向绑定的属性代理的类
 */
export function useModel<T extends AnyProps, K extends keyof T, V extends T[K]>(
  props: T,
  propName: K,
  defaultValue?: V
): ModelRef<T, K, V> {
  return new ModelRef(props, propName, defaultValue)
}
