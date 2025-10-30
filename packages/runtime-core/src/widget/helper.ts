import type {
  AnyProps,
  Child,
  ClassWidget,
  SimpleWidget,
  SimpleWidgetSymbol
} from '../types/index.js'
import { CLASS_WIDGET_BASE_SYMBOL, SIMPLE_FUNCTION_WIDGET_SYMBOL } from './constant.js'

/**
 * 标记一个'简单'的小部件
 *
 * 简单小部件实际表达的是无状态，内部逻辑不存在副作用的函数式组件。
 *
 * ```tsx
 * interface Props {
 *   title: string,
 *   color?: string
 * }
 * // 构建一个简单的小部件，它内部不包含任何副作用代码，也没有生命周期钩子
 * const Title = defineSimpleWidget(({title,color = 'black'}:Props) => {
 *   // 返回需要渲染的元素
 *   return <h1 style={{color}}>{title}</div>
 * })
 * function App() {
 *   return <Title title="Hello Vitarx" color="red" />
 * }
 * ```
 *
 * @param build - 视图构建器，通过函数返回要渲染的视图虚拟节点
 * @returns { SimpleWidget } - 简单小部件
 */
export function defineSimpleWidget<T extends (props: AnyProps) => Child>(
  build: T
): T & SimpleWidgetSymbol {
  Object.defineProperty(build, SIMPLE_FUNCTION_WIDGET_SYMBOL, { value: true })
  return build as T & SimpleWidgetSymbol
}
/**
 * 判断是否为简单小部件
 *
 * @param {any} fn - 小部件
 * @returns {boolean} - true 表示为简单小部件
 */
export function isSimpleWidget(fn: any): fn is SimpleWidget {
  return typeof fn === 'function' && fn[SIMPLE_FUNCTION_WIDGET_SYMBOL] === true
}
/**
 * 检查一个值是为类小部件构造函数
 * 这是一个类型谓词函数，用于类型收窄
 *
 * @param val 需要检查的值
 * @returns {boolean} 如果值是类Widget构造函数类型返回true，否则返回false
 */
export function isClassWidget(val: any): val is ClassWidget {
  // 使用可选链操作符安全地访问对象的CLASS_WIDGET_BASE_SYMBOL属性
  // 并检查其值是否为true
  return val?.[CLASS_WIDGET_BASE_SYMBOL] === true
}
