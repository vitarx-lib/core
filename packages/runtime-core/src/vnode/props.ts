import { isReactive, ReactiveProxyHandler, unref } from '@vitarx/responsive'
import { isRecordObject, popProperty } from '@vitarx/utils'
import { DomHelper } from '../dom/index.js'
import { getCurrentVNode } from './context.js'
import type { MergeProps } from './types/index.js'

const VNODE_PROPS_DEFAULT_DATA = Symbol('VNODE_PROPS_DEFAULT_DATA')
const VNODE_PROPS_SYMBOL = Symbol('VNODE_PROPS_SYMBOL')
const WARN_MESSAGE = `[Vitarx.PropsProxyHandler][WARN]：The component's props should maintain a one-way data flow, and you shouldn't modify it directly. (This warning only exists during the development and debugging phase)`
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
class PropsProxyHandler<T extends Record<string, any>> extends ReactiveProxyHandler<T, false> {
  constructor(target: T) {
    super(target, { deep: false })
  }

  /**
   * 重写对象的 get 方法，用于处理属性访问
   * @param target 目标对象
   * @param prop 要访问的属性名
   * @param receiver 代理对象或原始对象
   * @return 返回属性的值
   */
  override get(target: any, prop: any, receiver: any) {
    // 如果访问的是 VNODE_PROPS_SYMBOL 属性，直接返回 true
    if (prop === VNODE_PROPS_SYMBOL) return true
    // 首先尝试从父类获取属性值
    let value = super.get(target, prop, receiver)
    // 如果获取到的值为 undefined 或 null，则尝试从默认属性中获取
    if (value === undefined || value === null) {
      // 尝试从默认属性中获取
      const defaultProps = Reflect.get(this, VNODE_PROPS_DEFAULT_DATA)
      if (defaultProps && Reflect.has(defaultProps, prop)) {
        value = Reflect.get(defaultProps, prop, defaultProps)
      }
    }
    return value
  }

  /**
   * 重写 set 方法，用于处理属性值的设置
   * @param target 目标对象
   * @param prop 要设置的属性名
   * @param value 要设置的属性值
   * @param receiver 接收器对象
   * @return 返回设置是否成功
   */
  override set(target: T, prop: any, value: any, receiver: any): boolean {
    // 如果设置的属性是 VNODE_PROPS_DEFAULT_DATA，则使用 Object.defineProperty 进行特殊处理
    if (prop === VNODE_PROPS_DEFAULT_DATA) {
      // 定义属性，设置值和属性描述符
      Object.defineProperty(this, prop, { value, configurable: true, enumerable: false })
      return true // 返回 true 表示设置成功
    }
    // 在开发模式下，打印警告信息
    if (import.meta.env?.MODE === 'development') {
      console.warn(WARN_MESSAGE)
    }
    // 调用父类的 set 方法进行默认处理
    return super.set(target, prop, value, receiver)
  }

  /**
   * 重写 deleteProperty 方法，用于在删除属性时执行特定操作
   * @param target - 目标对象，即被代理的对象
   * @param prop - 要删除的属性名
   * @returns 返回一个布尔值，表示删除操作是否成功
   */
  override deleteProperty(target: T, prop: any): boolean {
    // 在开发环境下，打印警告信息
    if (import.meta.env?.MODE === 'development') {
      console.warn(WARN_MESSAGE) // 输出预设的警告消息
    }
    // 调用父类的 deleteProperty 方法执行实际的删除操作
    return super.deleteProperty(target, prop)
  }
}

/**
 * 创建props代理
 *
 * @internal 内部使用，请勿外部调用。
 * @param {Record<string, any>} props
 * @returns {Reactive<Record<string, any>>}
 */
export function proxyWidgetProps<T extends Record<string | symbol, any>>(props: T): Readonly<T> {
  // 避免重复代理
  if (props[VNODE_PROPS_SYMBOL]) {
    return props as Readonly<T>
  }
  return new PropsProxyHandler<T>(props).proxy as Readonly<T>
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
 *   onBeforeCreate(){
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
      '[Vitarx.defineProps][ERROR]：Parameter 1 (defaultProps) must be a key-value pair object'
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
    Reflect.set(inputProps, VNODE_PROPS_DEFAULT_DATA, defaultProps)
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

/**
 * 内置全局特殊属性
 */
export const INTRINSIC_PROPERTIES = [
  'children',
  'ref',
  'v-bind',
  'v-if',
  'v-memo',
  'v-static',
  'v-parent'
] as const
/**
 * 处理绑定属性
 * 从props中提取v-bind属性，并处理与已有属性的合并逻辑
 *
 * @internal 仅供内部使用
 * @param props - 需要处理的属性对象
 * @param [excludeIntrinsicProperty=true] - 是否排除内置属性
 */
export function _handleBindProps(
  props: Record<string, any>,
  excludeIntrinsicProperty: boolean = true
) {
  // 从props中提取v-bind属性，并返回剩余的props
  const bind = popProperty(props, 'v-bind')
  if (!bind) return
  let resolvedProps: Record<string, any> = bind // 初始化属性对象
  // 定义排除内置属性的排除列表
  const baseExclude: ReadonlyArray<string> = excludeIntrinsicProperty ? INTRINSIC_PROPERTIES : []
  // 定义排除列表
  let exclude: ReadonlySet<string>
  // 如果bind是数组，则分别获取属性对象和排除列表
  if (Array.isArray(bind)) {
    resolvedProps = bind[0] // 获取属性对象
    // 如果不是键值对对象，则结束函数
    if (!isRecordObject(resolvedProps)) return
    if (Array.isArray(bind[1])) {
      exclude = new Set(bind[1].concat(baseExclude))
    }
  }
  // 如果没有排除列表，则创建一个
  exclude ??= new Set(baseExclude)
  for (const key in resolvedProps) {
    const newValue = unref(resolvedProps[key])
    // 如果属性值为undefined或被排除则跳过
    if (newValue === undefined || exclude.has(key)) continue
    if (key in props) {
      const oldValue = unref(props[key])
      const type = typeof oldValue
      // 合并样式
      if (key === 'style') {
        const style = DomHelper.mergeCssStyle(oldValue, unref(newValue))
        if (type === 'string') {
          props[key] = DomHelper.cssStyleValueToString(style)
        } else {
          props[key] = DomHelper.cssStyleValueToObject(style)
        }
        continue
      }
      // 合并类名
      if (key === 'class' || key === 'className' || key === 'classname') {
        const type = typeof props[key]
        const className = DomHelper.mergeCssClass(oldValue, unref(newValue))
        if (type === 'string') {
          props[key] = DomHelper.cssClassValueToString(className)
        } else {
          props[key] = DomHelper.cssClassValueToArray(className)
        }
        continue
      }
    }
    // 将属性添加到props中
    props[key] = newValue
  }
}
