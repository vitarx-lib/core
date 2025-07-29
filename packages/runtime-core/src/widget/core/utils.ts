import type { VNode } from '../../vnode/index'
import type {
  AnyProps,
  ClassWidget,
  FunctionWidget,
  SimpleWidget,
  TsFunctionWidget
} from '../types/index'
import { CLASS_WIDGET_BASE_SYMBOL, SIMPLE_FUNCTION_WIDGET_SYMBOL } from './constant'

/**
 * 定义一个简单的小部件
 *
 * 通常在实际的项目开发中你可能会很少用到它，简单函数通常存在于组件库中，
 * 因为大部分组件可能只是提供了一些ui样式，并不需要生命周期，以及状态管理。
 *
 * 它只能做简单的视图构建工作，没有生命周期，不要在其内部存在任何副作用，包括但不限于：生命周期钩子，定时器，监听器，计算属性。
 *
 * ```tsx
 * interface Props {
 *   title: string,
 *   color?: string
 * }
 * // 构建一个简单的小部件，它内部不包含任何副作用代码，也没有生命周期钩子
 * const Title = simple(({title,color}:Props) => {
 *   // 对属性参数做一些处理
 *   color = color || 'black'
 *   // 返回需要渲染的元素
 *   return <h1 style={{color}}>{title}</div>
 * })
 * export default function App() {
 *   return <Title title="Hello Vitarx" color="red" />
 * }
 * ```
 *
 * @param build - 视图构建器，通过函数返回要渲染的视图虚拟节点
 * @returns {SimpleWidget} - 简单小部件
 */
export function simple<T extends AnyProps, R extends VNode | null>(
  build: (props: T) => R
): SimpleWidget<T, R> {
  Object.defineProperty(build, SIMPLE_FUNCTION_WIDGET_SYMBOL, { value: true })
  return build as SimpleWidget<T, R>
}

export { simple as defineSimpleWidget }

/**
 * 判断是否为简单小部件
 *
 * @param {any} fn - 小部件
 * @returns {boolean} - true 表示为简单小部件
 */
export function isSimpleWidget(fn: any): fn is SimpleWidget {
  return !!(typeof fn === 'function' && fn[SIMPLE_FUNCTION_WIDGET_SYMBOL])
}

/**
 * 导出小部件
 *
 * 负责将不被tsx兼容的小部件类型，重载为tsx兼容的小部件。
 *
 * 只是一个语法糖，重载了类型，实际上并不会对小部件进行任何处理，编译时会被编译器自动移除。
 *
 * @template P - 小部件的属性类型
 * @param {FunctionWidget<P>} fn - 小部件
 * @returns {TsFunctionWidget<P>} - 导出的小部件
 */
export function exportWidget<P extends AnyProps>(fn: FunctionWidget<P>): TsFunctionWidget<P> {
  return fn as TsFunctionWidget<P>
}

/**
 * 辅助判断一个构造函数是否为类组件
 *
 * @param {any} val - 待判断的值
 * @returns {val is ClassWidget} - 如果是类组件则返回true，否则返回false
 */
export function isClassWidget(val: any): val is ClassWidget {
  return val?.[CLASS_WIDGET_BASE_SYMBOL] === true
}
