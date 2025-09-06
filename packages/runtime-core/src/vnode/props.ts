import { isReactive, ReactiveProxyHandler } from '@vitarx/responsive'
import { isRecordObject } from '@vitarx/utils'
import { getCurrentVNode } from './context.js'

const VNODE_PROPS_DEFAULT_DATA = Symbol('VNODE_PROPS_DEFAULT_DATA')
const VNODE_PROPS_SYMBOL = Symbol('VNODE_PROPS_SYMBOL')
const message = `[Vitarx.PropsProxyHandler][WARN]：The component's props should maintain a one-way data flow, and you shouldn't modify it directly. (This warning only exists during the development and debugging phase)`

/**
 * props代理处理器
 */
class PropsProxyHandler<T extends Record<string, any>> extends ReactiveProxyHandler<T, false> {
  constructor(target: T) {
    super(target, { deep: false })
  }
  override get(target: any, prop: any, receiver: any) {
    if (prop === VNODE_PROPS_SYMBOL) return true
    let value = super.get(target, prop, receiver)
    if (value === undefined || value === null) {
      // 尝试从默认属性中获取
      const defaultProps = Reflect.get(this, VNODE_PROPS_DEFAULT_DATA)
      if (defaultProps && Reflect.has(defaultProps, prop)) {
        value = Reflect.get(defaultProps, prop, defaultProps)
      }
    }
    return value
  }

  override set(target: T, prop: any, value: any, receiver: any): boolean {
    if (prop === VNODE_PROPS_DEFAULT_DATA) {
      Object.defineProperty(this, prop, { value })
      return true
    }
    if (import.meta.env?.MODE === 'development') {
      console.warn(message)
    }
    return super.set(target, prop, value, receiver)
  }

  override deleteProperty(target: T, prop: any): boolean {
    if (import.meta.env?.MODE === 'development') {
      console.warn(message)
    }
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
 * 注意：定义的默认属性通过 key in props 判断是无效的，它并没有合并到 props 对象中
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
 * 注意：定义的默认属性通过 key in props 判断是无效的，它并没有合并到 props 对象中
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
 * @return {Readonly<Omit<I, keyof D> & D>} - 返回合并后的只读Props对象
 * @alias defineDefaultProps
 */
export function defineProps<D extends Record<string, any>, I extends Record<string, any>>(
  defaultProps: D,
  inputProps: I
): Readonly<Omit<I, keyof D> & D>
export function defineProps<D extends Record<string, any>, I extends Record<string, any> = {}>(
  defaultProps: D,
  inputProps?: I
): Readonly<Omit<I, keyof D> & D> {
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
  return inputProps as Readonly<Omit<I, keyof D> & D>
}

/**
 * defineDefaultProps是defineProps的别名
 *
 * @see defineProps
 */
export { defineProps as defineDefaultProps }
