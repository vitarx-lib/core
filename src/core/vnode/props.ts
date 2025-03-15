import { isReactive } from '../responsive/index.js'
import { isRecordObject } from '../../utils/index.js'
import { getCurrentVNode } from './manager.js'
import { defaultPropsSymbol } from './internal.js'

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
    throw new TypeError('[Vitarx.defineProps][ERROR]：参数1(defaultProps)必须是键值对对象')
  }

  // 如果未提供inputProps，则尝试从当前VNode获取
  if (!inputProps) {
    const currentVNode = getCurrentVNode()
    if (!currentVNode) {
      throw new Error(
        '[Vitarx.defineProps][ERROR]：无法获取当前VNode，defineProps必须在小部件作用域下调用（初始化阶段）'
      )
    }
    inputProps = currentVNode.props as I
  }

  // 处理响应式对象
  if (isReactive(inputProps)) {
    // 对于响应式对象，使用Symbol标记默认属性
    Reflect.set(inputProps, defaultPropsSymbol, defaultProps)
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
