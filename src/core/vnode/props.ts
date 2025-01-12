import {
  Depend,
  type ExtractProp,
  isReactive,
  type Reactive,
  ReactiveHandler
} from '../responsive/index.js'
import { isRecordObject } from '../../utils/index.js'
import { getCurrentVNode } from './manager.js'
import { Observers } from '../observer/index.js'

// 默认属性标记
const defaultPropsSymbol = Symbol('VNODE_PROPS_DEFAULT_DATA')
// 修改props发出警告
const propsModifyWarning = import.meta.env?.MODE === 'development'

/**
 * 定义属性
 *
 * 此函数在类定义小部件中也可以使用，通常位于构造函数或`onCreated`钩子中。
 *
 * 可以把props做为第二个参数传入，这在函数式组件中能够获得更好的类型提示与校验。
 * @example
 * ```tsx
 * interface Props {
 *  name: string
 *  age?: number
 * }
 * function Foo(_props: Props) {
 *   const props = defineProps<Props>({
 *     age: 'vitarx'
 *   },_props)
 *   // props 推导类型如下
 *   interface Props {
 *     name: string
 *     age: number
 *   }
 * }
 * ```
 *
 * @param {Record<string, any>} defaultProps - 默认属性
 * @returns {Readonly<Record<string, any>} - 合并过后的只读对象
 */
export function defineProps<D extends Record<string, any>>(defaultProps: D): Readonly<D>
/**
 * 定义属性
 *
 * 此函数在类定义小部件中也可以使用，通常位于构造函数或`onCreated`钩子中。
 *
 * @param {Record<string, any>} defaultProps - 默认属性
 * @param {Record<string, any>} inputProps - 外部传入给组件的props
 * @returns {Readonly<Record<string, any>} - 合并过后的只读对象
 */
export function defineProps<D extends Record<string, any>, T extends Record<string, any>>(
  defaultProps: D,
  inputProps: T
): Readonly<T & D>
export function defineProps<D extends Record<string, any>, T extends Record<string, any> = {}>(
  defaultProps: D,
  inputProps?: T
): Readonly<T & D> {
  if (!isRecordObject(defaultProps)) {
    throw new TypeError('[Vitarx.defineProps][ERROR]：参数1(defaultProps)必须是键值对对象')
  }
  if (!inputProps) {
    const props = getCurrentVNode()!.props as T
    if (!props) {
      throw new Error(
        '[Vitarx.defineProps][ERROR]：defineProps 必须在小部件作用域下调用（初始化阶段）'
      )
    }
    inputProps = props
  }
  if (isReactive(inputProps)) {
    Reflect.set(inputProps, defaultPropsSymbol, defaultProps)
  } else {
    for (const key in defaultProps) {
      if (!(key in inputProps) || inputProps[key] === undefined || inputProps[key] === null) {
        inputProps[key] = defaultProps[key] as any
      }
    }
  }
  return inputProps as T & D
}

/**
 * props代理处理器
 */
class PropsProxyHandler<T extends Record<string, any>> extends ReactiveHandler<T> {
  override get(target: T, prop: ExtractProp<T>, receiver: any) {
    let value = super.get(target, prop, receiver)
    if (value === undefined || value === null) {
      // 尝试从默认属性中获取
      const defaultProps = Reflect.get(this, defaultPropsSymbol)
      if (defaultProps && Reflect.has(defaultProps, prop)) {
        value = Reflect.get(defaultProps, prop, defaultProps)
      }
    }
    return value
  }

  override set(target: T, prop: ExtractProp<T>, value: any, receiver: any): boolean {
    if (prop === defaultPropsSymbol) {
      Object.defineProperty(this, prop, { value })
      return true
    }
    if (propsModifyWarning) {
      const stack = new Error().stack // 获取当前堆栈
      console.warn(
        `[Vitarx.PropsProxyHandler][WARN]：组件的 props 应保持单向数据流，你不应该直接修改它。(此警告信息仅在开发调试阶段存在)\nStack trace:\n${stack}`
      )
    }
    return super.set(target, prop, value, receiver)
  }

  override deleteProperty(target: T, prop: ExtractProp<T>): boolean {
    if (propsModifyWarning) {
      console.trace(
        '[Vitarx.PropsProxyHandler][WARN]：组件的 props 应保持单向数据流，你不应该直接修改它。(此警告信息仅在开发调试阶段存在)'
      )
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
export function _proxyWidgetInstanceProps<T extends Record<string, any>>(props: T): Reactive<T> {
  const proxy = new Proxy(
    props,
    new PropsProxyHandler<T>(
      false,
      prop => {
        Observers.trigger(proxy, prop)
      },
      prop => {
        Depend.track(proxy, prop)
      }
    )
  ) as Reactive<T>
  return proxy
}
