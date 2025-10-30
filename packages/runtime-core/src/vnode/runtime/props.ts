import {
  Depend,
  isReactive,
  PROXY_SIGNAL_SYMBOL,
  SIGNAL_RAW_VALUE_SYMBOL,
  SIGNAL_SYMBOL,
  SignalManager,
  unref
} from '@vitarx/responsive'
import { isRecordObject, logger } from '@vitarx/utils'
import { LogLevel } from '@vitarx/utils/src/index.js'
import type { MergeProps } from '../../types/index.js'
import { getCurrentVNode } from './context.js'

const VNODE_PROPS_DEFAULT_DATA_SYMBOL = Symbol('VNODE_PROPS_DEFAULT_DATA')
const VNODE_PROPS_PROXY_SYMBOL = Symbol('VNODE_PROPS_SYMBOL')
const WARN_MESSAGE = `The component's props should maintain a one-way data flow, and you shouldn't modify it directly.`
const STATIC_SYMBOL = new Set([SIGNAL_SYMBOL, PROXY_SIGNAL_SYMBOL, VNODE_PROPS_PROXY_SYMBOL])

/**
 * PropsProxyHandler 是一个属性代理处理器类，用于管理和代理对象的属性访问。
 * 该类继承自 ReactiveProxyHandler，主要用于处理 VNode 属性的特殊访问和设置逻辑。
 *
 * 主要功能：
 * - 属性访问代理：处理对象属性的读取，支持从默认属性中获取值
 * - 属性设置代理：管理对象属性的设置，包含特殊属性的处理
 * - 属性删除代理：处理对象属性的删除操作
 *
 * @example
 * const target = { name: 'test' };
 * const proxy = new Proxy(target, new PropsProxyHandler(target));
 *
 * @param target - 需要被代理的目标对象，类型为 T
 *
 * @remarks
 * - 该类主要用于处理 VNode 相关的属性代理，包含了 VNODE_PROPS_SYMBOL 和 VNODE_PROPS_DEFAULT_DATA 等特殊属性的处理
 * - 在开发环境下，对属性设置和删除操作会输出警告信息
 * - 该代理处理器默认不进行深度代理（deep: false）
 */
class PropsProxyHandler<T extends Record<string, any>> implements ProxyHandler<T> {
  public readonly proxy: T
  public [VNODE_PROPS_DEFAULT_DATA_SYMBOL]?: Partial<T>
  constructor(target: T, defaultProps?: Partial<T>) {
    this.proxy = new Proxy(target, this)
    if (defaultProps && typeof defaultProps === 'object') {
      this[VNODE_PROPS_DEFAULT_DATA_SYMBOL] = defaultProps
    }
  }
  get(target: T, prop: string | symbol) {
    if (typeof prop === 'symbol') {
      if (prop === VNODE_PROPS_DEFAULT_DATA_SYMBOL) return this[VNODE_PROPS_DEFAULT_DATA_SYMBOL]
      if (STATIC_SYMBOL.has(prop)) return true
      if (prop === SIGNAL_RAW_VALUE_SYMBOL) return target
    }

    // 获取值
    const value = Reflect.get(target, prop)
    // 如果获取到的值为 undefined 或 null，则尝试从默认属性中获取
    if (value === undefined || value === null) {
      // 尝试从默认属性中获取
      const defaultProps = Reflect.get(this, VNODE_PROPS_DEFAULT_DATA_SYMBOL)
      if (defaultProps && Reflect.has(defaultProps, prop)) {
        return Reflect.get(defaultProps, prop, defaultProps)
      }
    }
    this.track(prop)
    return unref(value)
  }
  set(target: T, prop: string | symbol, value: any): boolean {
    // 设置默认属性
    if (prop === VNODE_PROPS_DEFAULT_DATA_SYMBOL) {
      this[VNODE_PROPS_DEFAULT_DATA_SYMBOL] = value
      return true // 返回 true 表示设置成功
    }
    logger.warn(WARN_MESSAGE)
    const oldValue = Reflect.get(target, prop)
    if (oldValue === value) return true
    if (!Reflect.set(target, prop, value)) return false
    this.notify(prop)
    return true
  }
  has(target: T, prop: string | symbol): boolean {
    this.track(prop)
    return Reflect.has(target, prop)
  }
  deleteProperty(target: T, prop: any): boolean {
    logger.warn(WARN_MESSAGE) // 输出预设的警告消息
    this.notify(prop)
    return Reflect.deleteProperty(target, prop)
  }
  /**
   * 通知观察者属性发生变化
   * 会同时通知当前对象的观察者和所有父级对象的观察者
   *
   * @private
   */
  private notify(prop: string | symbol) {
    SignalManager.notifySubscribers(this.proxy as any, prop as any)
  }
  /**
   * 收集属性的依赖关系
   * 用于在属性被访问时收集依赖，实现响应式追踪
   *
   * @param {AnyKey} prop - 被访问的属性
   * @private
   */
  private track(prop: string | symbol) {
    Depend.track(this.proxy as Record<string | symbol, any>, prop)
  }
}

/**
 * 创建props代理
 *
 * @internal 内部使用，请勿外部调用。
 * @param {object} props
 * @param {object} defaultProps - 默认属性对象
 * @returns {Readonly<Record<string, any>>} - 只读属性对象
 */
export function proxyWidgetProps<T extends Record<string | symbol, any>>(
  props: T,
  defaultProps?: Partial<T>
): Readonly<T> {
  // 避免重复代理
  if (props[VNODE_PROPS_PROXY_SYMBOL]) {
    if (!isRecordObject(defaultProps)) {
      props[VNODE_PROPS_DEFAULT_DATA_SYMBOL] = defaultProps
    }
    return props as Readonly<T>
  }
  return new PropsProxyHandler<T>(props, defaultProps).proxy as Readonly<T>
}

/**
 * 定义默认`Props` 属性
 *
 * 注意：定义的默认属性通过 key in props 判断是无效的，它并没有真实合并到 props 对象中
 *
 * @example
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
 *   // 这是因为`defineProps`并不知道组件是如何定义的 Props 接口
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
 *
 * // 在类组件中也可以使用此API
 *
 * class UserInfo extends Widget<Props,Required<T>>{
 *   onCreate(){
 *     defineProps({ gender: 1 })
 *   }
 *   build(){
 *     // this.props.gender 会被ts类型推导为 number 类型，这归功于Widget所接收的第二个泛型参数
 *     return <div>{this.props.name} - {this.props.gender}</div>
 *   }
 * }
 *
 * @template D - 默认属性对象的类型
 * @param {D} defaultProps - 默认属性对象
 * @return {Readonly<D>} - 返回只读的Props对象
 * @alias defineDefaultProps
 */
export function defineProps<D extends Record<string, any>>(defaultProps: D): Readonly<D>
/**
 * 定义默认`Props` 属性
 *
 * 注意：定义的默认属性通过 key in props 判断是无效的，它并没有真实写入到 props 对象中
 *
 * @example
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
 *
 * @template I - 组件接收的props对象的类型
 * @template D - 默认属性对象的类型
 * @param {D} defaultProps - 默认属性对象
 * @param {I} inputProps - 组件接收的props对象
 * @return {Readonly<D & MergeProps<I, keyof D>>} - 返回合并后的只读Props对象
 * @alias defineDefaultProps
 */
export function defineProps<D extends Record<string, any>, I extends Record<string, any>>(
  defaultProps: D,
  inputProps: I
): Readonly<MergeProps<I, D>>
export function defineProps<D extends Record<string, any>, I extends Record<string, any> = {}>(
  defaultProps: D,
  inputProps?: I
): Readonly<MergeProps<I, D>> {
  // 验证defaultProps参数类型
  if (!isRecordObject(defaultProps)) {
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
    inputProps = currentVNode.props as I
  }

  // 处理响应式对象
  if (isReactive(inputProps)) {
    // 对于响应式对象，使用Symbol标记默认属性
    Reflect.set(inputProps, VNODE_PROPS_DEFAULT_DATA_SYMBOL, defaultProps)
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
 * defineDefaultProps是defineProps的别名
 *
 * @see defineProps
 */
export { defineProps as defineDefaultProps }
