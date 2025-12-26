import { isReactive, ObjectReactive } from '@vitarx/responsive'
import type { AnyRecord } from '@vitarx/utils'
import { isObject, isPlainObject, logger, LogLevel } from '@vitarx/utils'
import type { AnyProps, MergeProps, ReadonlyProps } from '../types/index.js'
import { getCurrentVNode } from './context.js'

const DEFAULT_PROPS = Symbol.for('__v_props:default-props')
const IS_PROPS_PROXY = Symbol.for('__v_props:is-props-proxy')
const WARN_MESSAGE = `The component's props should maintain a one-way data flow, and you shouldn't modify it directly.`

let isReadonlySuspended = false
/**
 * PropsProxy 是一个属性代理处理器类，用于管理和代理对象的属性访问。
 * 该类继承自 ReactiveObject，主要用于处理 VNode 属性的特殊访问和设置逻辑。
 *
 * 主要功能：
 * - 属性访问代理：处理对象属性的读取，支持从默认属性中获取值
 * - 属性设置代理：管理对象属性的设置，包含特殊属性的处理
 * - 属性删除代理：处理对象属性的删除操作
 *
 * @param target - 需要被代理的目标对象，类型为 T
 */
class readonlyProps<T extends Record<string, any>> extends ObjectReactive<T> {
  public _defaultProps?: Partial<T>
  constructor(target: T, defaultProps?: Partial<T>) {
    super(target, false)
    if (isObject(defaultProps)) {
      this._defaultProps = defaultProps
    }
  }
  override set(target: T, p: string | symbol, newValue: any, _receiver: any): boolean {
    if (p === DEFAULT_PROPS) {
      this._defaultProps = newValue
      return true
    }
    if (!isReadonlySuspended) logger.warn(WARN_MESSAGE)
    return super.set(target, p, newValue, _receiver)
  }
  override get(target: T, p: string | symbol, receiver: any): any {
    if (p === IS_PROPS_PROXY) return true
    if (p === DEFAULT_PROPS) return this._defaultProps
    const value = super.get(target, p, receiver)
    if (value === undefined || value === null) {
      // 尝试从默认属性中获取
      const defaultProps = this._defaultProps
      if (defaultProps && p in defaultProps) {
        return Reflect.get(defaultProps, p, defaultProps)
      }
    }
    return value
  }
  override deleteProperty(target: T, p: string | symbol): boolean {
    if (!isReadonlySuspended) logger.warn(WARN_MESSAGE)
    return super.deleteProperty(target, p)
  }
}
/**
 * 强制设置属性的函数
 * 该函数通过临时挂起只读状态，允许在只读上下文中执行属性设置操作
 *
 * 仅在底层驱动中使用，开发者应遵守单向数据流，避免数据混乱。
 *
 * @internal
 * @template T - 函数返回值
 * @param update - 要执行的更新函数，该函数内部进行属性更新操作不会触发警告
 * @returns {T} 无返回值
 */
export function forceUpdateProps<T>(update: () => T): T {
  // 挂起只读状态，设置为true表示允许修改
  isReadonlySuspended = true
  try {
    // 执行传入的设置函数
    return update()
  } finally {
    // 无论是否发生异常，最终都会恢复只读状态
    isReadonlySuspended = false
  }
}
/**
 * 创建props代理
 *
 * @param {object} props
 * @param {object} defaultProps - 默认属性对象
 * @returns {Readonly<Record<string, any>>} - 只读属性对象
 */
export function proxyProps<T extends Record<string | symbol, any>>(
  props: T,
  defaultProps?: Partial<T>
): ReadonlyProps<T> {
  // 避免重复代理
  if (props[IS_PROPS_PROXY]) {
    if (isPlainObject(defaultProps)) {
      ;(props as AnyRecord)[DEFAULT_PROPS] = defaultProps
    }
    return props as Readonly<T>
  }
  return new readonlyProps<T>(props, defaultProps).proxy as ReadonlyProps<T>
}
/**
 * 动态定义默认Props
 *
 * @example 在函数式组件中使用
 * ```tsx
 * interface Props {
 *   name: string
 *   gender?: number
 * }
 * function UserInfo(_props: Props){
 *   const props = defineProps({
 *     gender: 1
 *   })
 *   // props 类型推导如下：
 *   // {
 *   //   gender: string
 *   // }
 *   // 从上面的推导结果可以看出缺少了name属性，
 *   // 这是因为`defineProps`并不知道组件是如何定义的 Props 类型接口
 *   // 所以为了更好的类型推导，我们需要将函数接收的props当做第二参数传递给defineProps
 *   const props2 = defineProps({
 *     gender: 1
 *   }, _props)
 *   // ✅ props2 类型推导如下：
 *   // {
 *   //   name: string
 *   //   gender: number
 *   // }
 *
 *   return <div>{props2.name} - {props2.gender}</div>
 * }
 * ```
 *
 * @example 在类组件中使用
 * ```tsx
 * interface Props {
 *   name: string
 *   gender?: number
 * }
 * class UserInfo extends Widget<Props,Required<T>>{
 *   onCreate(){
 *     defineProps({ gender: 1 })
 *   }
 *   build(){
 *     // this.props.gender 会被ts类型推导为 number 类型，这归功于Widget所接收的第二个泛型参数
 *     return <div>{this.props.name} - {this.props.gender}</div>
 *   }
 * }
 * ```
 *
 *
 * @override
 * @template D - 默认属性对象的类型
 * @param {D} defaultProps - 默认属性对象
 * @return {Readonly<D>} - 返回只读的Props对象
 */
export function defineProps<D extends AnyProps>(defaultProps: D): ReadonlyProps<D>
/**
 * 动态定义默认Props
 *
 * @example 在函数式组件中传入第二个参数优化类型推导
 * ```tsx
 * interface Props {
 *   name: string
 *   gender?: number
 * }
 * function UserInfo(_props: Props){
 *   const props = defineProps({
 *     gender: 1
 *   }, _props)
 *   // ✅ props 类型推导如下：
 *   // {
 *   //   name: string
 *   //   gender: number
 *   // }
 *
 *   return <div>{props.name} - {props.gender}</div>
 * }
 * ```
 *
 * @override
 * @template I - 组件接收的props对象的类型
 * @template D - 默认属性对象的类型
 * @param {D} defaultProps - 默认属性对象
 * @param {I} inputProps - 组件接收的props对象
 * @return {Readonly<D & MergeProps<I, keyof D>>} - 返回合并后的只读Props对象
 * @alias defineDefaultProps
 */
export function defineProps<D extends AnyProps, I extends AnyProps>(
  defaultProps: D,
  inputProps: I
): ReadonlyProps<I, D>
export function defineProps<D extends AnyProps, I extends AnyProps = {}>(
  defaultProps: D,
  inputProps?: I
): ReadonlyProps<I, D> {
  // 验证defaultProps参数类型
  if (!isPlainObject(defaultProps)) {
    throw new TypeError(
      logger.formatMessage(
        LogLevel.ERROR,
        'defineProps() Parameter 1 (defaultProps) must be a key-value pair object'
      )
    )
  }

  // 如果未提供inputProps，则尝试从当前VNode获取
  if (!inputProps) {
    const currentVNode = getCurrentVNode()
    if (!currentVNode) {
      throw new Error(
        '[Vitarx.defineProps][ERROR]：Unable to get the current VNode, defineProps must be called under the scope of the widget (initialization phase)'
      )
    }
    inputProps = currentVNode.instance!.props as I
  }

  // 处理响应式对象
  if (isReactive(inputProps)) {
    // 对于响应式对象，使用Symbol标记默认属性
    Reflect.set(inputProps, DEFAULT_PROPS, defaultProps)
  } else {
    // 对于非响应式对象，直接合并属性
    // 只有当inputProps中不存在该属性或值为undefined/null时才使用默认值
    for (const key in defaultProps) {
      if (!(key in inputProps) || inputProps[key] === undefined || inputProps[key] === null) {
        inputProps[key as keyof I] = defaultProps[key] as any
      }
    }
  }

  // 返回只读对象
  return inputProps as unknown as Readonly<MergeProps<I, D>>
}

/**
 * defineDefaultProps 是 defineProps 的别名
 *
 * @see defineProps
 */
export { defineProps as defineDefaultProps }
