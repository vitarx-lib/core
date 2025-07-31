import { isReactive, ReactiveProxyHandler } from '@vitarx/responsive'
import { isRecordObject } from '@vitarx/utils'
import { isObject } from '@vitarx/utils/src/index'
import { findParentVNode, getCurrentVNode, type VNode, type WidgetVNode } from '../../vnode/index'
import { Widget } from '../core/index'
import { useCurrentInstance } from './instance'

const VNODE_PROPS_DEFAULT_DATA = Symbol('VNODE_PROPS_DEFAULT_DATA')
const VNODE_PROPS_SYMBOL = Symbol('VNODE_PROPS_SYMBOL')
const message = `[Vitarx.PropsProxyHandler][WARN]：The component's props should maintain a one-way data flow, and you shouldn't modify it directly. (This warning only exists during the development and debugging phase)`

/**
 * props代理处理器
 */
class PropsProxyHandler<T extends Record<string, any>> extends ReactiveProxyHandler<T> {
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

/**
 * 依赖提供
 *
 * 该函数允许组件向其所有子组件提供数据，形成依赖注入体系。子组件可通过 `inject` 函数获取祖先组件提供的数据。
 *
 * @remarks
 * 在类组件中使用时，第三个参数 `instance` 需要特别注意：
 * - 在 `constructor` 或 `onBeforeCreate` 方法中调用时，可以省略 `this` 参数
 * - 在其他生命周期钩子或方法中调用时，必须传入 `this` 作为 `instance` 参数
 * - 这是因为只有在组件构造阶段才能自动获取到关联的上下文
 *
 * @example
 * ```ts
 * // 在类组件中
 * class MyWidget extends Widget {
 *   constructor(props) {
 *     super(props);
 *     // 构造函数中可以省略this
 *     provide('theme', 'dark');
 *   }
 *
 *   onMounted() {
 *     // 其他方法中必须传入this
 *     provide('userData', { id: 1 }, this);
 *   }
 * }
 * ```
 *
 * @param name - 依赖数据的唯一标识符，可以是字符串或Symbol
 * @param value - 要提供的数据值
 * @param [instance] - 组件实例，在类组件的非构造阶段必须提供
 * @returns {void}
 */
export function provide(name: string | symbol, value: any, instance?: Widget): void {
  if (name === 'App') {
    throw new Error('App is an internal reserved keyword, please do not use it!')
  }
  const currentVNode = instance?.['vnode'] || getCurrentVNode()
  if (!currentVNode) throw new Error('provide must be called in widget')
  if (!currentVNode.provide) {
    ;(currentVNode as WidgetVNode).provide = { [name]: value }
  } else {
    currentVNode.provide[name] = value
  }
}

/**
 * 依赖注入
 *
 * 该函数用于获取由祖先组件通过 `provide` 函数提供的数据。如果找不到指定名称的数据，则返回默认值。
 *
 * @remarks
 * 在类组件中使用时，第三个参数 `instance` 需要特别注意：
 * - 在 `constructor` 或 `onBeforeCreate` 方法中调用时，可以省略 `this` 参数
 * - 在其他生命周期钩子或方法中调用时，必须传入 `this` 作为 `instance` 参数
 * - 函数式组件中无需提供 `instance` 参数
 *
 * @example
 * ```ts
 * // 在类组件中
 * class MyWidget extends Widget {
 *   // onCreate
 *   constructor(props) {
 *     super(props);
 *     // 构造函数或onCreate生命周期内可以省略this
 *     const theme = inject('theme', 'light');
 *   }
 *
 *   onMounted() {
 *     // 其他方法中必须传入this
 *     const userData = inject('userData', {}, this);
 *   }
 * }
 *
 * // 在函数式组件中
 * function MyFunctionalWidget(props) {
 *   // 函数式组件中直接调用，无需提供instance
 *   const theme = inject('theme', 'light');
 *   return <div className={theme}>...</div>;
 * }
 * ```
 *
 * @template T - 注入数据的类型
 * @param name - 要注入的依赖数据的唯一标识符，与provide中使用的标识符对应
 * @param defaultValue - 当找不到指定名称的依赖数据时返回的默认值
 * @param [instance] - 组件实例，函数式组件无需提供，类组件在非构造阶段必须传入当前组件实例`this`
 * @returns {T} - 注入的数据或默认值
 * @throws - 当无法获取上下文时抛出错误
 */
export function inject<T = any>(
  name: string | symbol,
  defaultValue: T = undefined as T,
  instance?: Widget
): T {
  instance ??= useCurrentInstance()
  const currentVNode = instance?.['vnode']
  if (!currentVNode) {
    throw new Error(
      `[Vitarx.inject][ERROR]：Without obtaining a context, inject can only obtain a context or explicitly specify a component instance during component construction`
    )
  }
  // 从当前 VNode 向上查找父级 VNode，直到找到或没有父级
  let parentVNode: VNode | undefined = findParentVNode(currentVNode)
  while (parentVNode) {
    // 判断当前 VNode 是否包含提供的数据
    if ('provide' in parentVNode && isObject(parentVNode.provide) && name in parentVNode.provide) {
      return parentVNode.provide[name] // 找到数据则返回
    }
    // 获取父级 VNode
    parentVNode = findParentVNode(parentVNode)
  }
  // 如果没有找到数据，返回默认值
  return defaultValue
}
