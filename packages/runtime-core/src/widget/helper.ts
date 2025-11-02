import type {
  AnyProps,
  ClassWidget,
  StatelessWidget,
  StatelessWidgetSymbol,
  VNodeChild,
  WidgetType
} from '../types/index.js'
import { CLASS_WIDGET_BASE_SYMBOL, STATELESS_FUNCTION_WIDGET_SYMBOL } from './constant.js'

/**
 * 标记/定义一个无状态的小部件
 *
 * 无状态小部件必须是内部逻辑不存在副作用的函数式组件。
 *
 * ```tsx
 * interface Props {
 *   title: string,
 *   color?: string
 * }
 * // 构建一个无状态小部件的小部件，它内部不包含任何副作用代码，也没有生命周期钩子
 * const Title = defineStatelessWidget(({title,color = 'black'}:Props) => {
 *   // 返回需要渲染的元素
 *   return <h1 style={{color}}>{title}</div>
 * })
 * function App() {
 *   return <Title title="Hello Vitarx" color="red" />
 * }
 * ```
 *
 * @param build - 视图构建器，通过函数返回要渲染的视图虚拟节点
 * @returns { StatelessWidget } - 无状态小部件
 */
export function defineStatelessWidget<T extends (props: AnyProps) => VNodeChild>(
  build: T
): T & StatelessWidgetSymbol {
  Object.defineProperty(build, STATELESS_FUNCTION_WIDGET_SYMBOL, { value: true })
  return build as T & StatelessWidgetSymbol
}

/**
 * 定义一个简单小部件
 *
 * @deprecated 4.0 版本起标记为弃用，请使用 defineStatelessWidget 替代
 * @see {@linkcode defineStatelessWidget}
 */
export function defineSimpleWidget<T extends (props: AnyProps) => VNodeChild>(
  build: T
): T & StatelessWidgetSymbol {
  return defineStatelessWidget(build)
}

/**
 * 标记一个简单小部件
 *
 * @deprecated 4.0 版本起标记为弃用，请使用 defineStatelessWidget 替代
 * @see {@linkcode defineStatelessWidget}
 */
export function markSimpleWidget<T extends (props: AnyProps) => VNodeChild>(
  build: T
): T & StatelessWidgetSymbol {
  return defineStatelessWidget(build)
}

/**
 * 判断是否为无状态小部件
 *
 * @param {any} fn - 函数式组件
 * @returns {boolean} - true 表示为简单小部件
 */
export function isStatelessWidget(fn: any): fn is StatelessWidget {
  return typeof fn === 'function' && fn[STATELESS_FUNCTION_WIDGET_SYMBOL] === true
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

/**
 * 检查给定值是否为Widget组件类型
 *
 * 这是一个类型保护函数，用于在运行时验证变量是否为Widget组件类型
 *
 * 只要是函数/构造函数都会被判断为Widget组件类型，由于js语言特性，暂无更精准的判断方式。
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是函数类型则返回true，否则返回false
 */
export function isWidget(val: any): val is WidgetType {
  return typeof val === 'function'
}
