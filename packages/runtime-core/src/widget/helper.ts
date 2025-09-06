import { isVNode } from '../vnode/guards.js'
import { type VNode } from '../vnode/index.js'
import { CLASS_WIDGET_BASE_SYMBOL, SIMPLE_FUNCTION_WIDGET_SYMBOL } from './constant.js'
import type {
  AnyProps,
  BuildVNode,
  ClassWidget,
  FunctionWidget,
  SimpleWidget,
  TsFunctionWidget
} from './types/index.js'

/**
 * 标记一个简单的小部件
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
 * const Title = markSimpleWidget(({title,color}:Props) => {
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
export function markSimpleWidget<T extends AnyProps, R extends VNode | null>(
  build: (props: T) => R
): SimpleWidget<T, R> {
  Object.defineProperty(build, SIMPLE_FUNCTION_WIDGET_SYMBOL, { value: true })
  return build as SimpleWidget<T, R>
}

export { markSimpleWidget as defineSimpleWidget }

/**
 * 判断是否为简单小部件
 *
 * @param {any} fn - 小部件
 * @returns {boolean} - true 表示为简单小部件
 */
export function isSimpleWidget(fn: any): fn is SimpleWidget {
  return typeof fn === 'function' && SIMPLE_FUNCTION_WIDGET_SYMBOL in fn
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
 * 检查一个值是否是ClassWidget类型的实例
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

/**
 * ## 视图构建器。
 *
 * > 注意：在类小部件中不要使用`build`函数，类中的build方法就是构建器。
 *
 * 一般情况编译器会自动添加`()=>`，但是使用了三元运算符或包裹在了if块中则无法添加，
 * 所以需要使用返回`()=>Element`来保证响应式，但是这样做tsx会不认可返回()=>Element的函数做为组件，特此声明了此方法。
 *
 * 在编译时会自动去除build调用表达式
 *
 * ```tsx
 * const App = () => {
 *  const show = ref(true)
 *  // ❌ 这样写编译器不会自动添加 () => 会导致视图是静态的，丢失响应式
 *  return state.value ? <div>真</div> : <div>假</div>
 *  // ✅ 这样写只是强制转换了类型，在编译时 build会被自动去除
 *  return build(() => show.value ? <div>真</div> : <div>假</div>)
 * }
 * export default App
 * ```
 *
 * @param element - 虚拟节点对象|视图构建器函数|null
 * @returns - 为了符合TSX类型校验，会将视图构建器函数重载为VNode类型
 * @throws TypeError - 如果传入的参数不符合要求，则会抛出TypeError异常
 */
export function build<T extends BuildVNode>(element: T): T extends null ? null : VNode {
  if (element === null) return null as any
  if (typeof element === 'function') return element as any
  if (isVNode(element)) return element as any
  throw new TypeError('[Vitarx.build]：函数组件返回值只能是null、VNode、() => VNode | null')
}
