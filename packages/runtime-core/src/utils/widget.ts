import { CLASS_WIDGET_BASE_SYMBOL, STATELESS_F_WIDGET_SYMBOL } from '../constants/index.js'
import type {
  ClassWidget,
  Renderable,
  StatelessWidget,
  StatelessWidgetSymbol,
  WidgetTypes
} from '../types/index.js'

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
 * @since 4.0.0
 * @alias stateless
 * @param build - 视图构建器，通过函数返回要渲染的视图虚拟节点
 * @param [displayName] - 组件名称，给匿名函数设置一个显示名称
 * @returns { StatelessWidget } - 无状态小部件
 */
export function defineStatelessWidget<T extends (props: any) => Renderable>(
  build: T,
  displayName?: string
): T & StatelessWidgetSymbol {
  Object.defineProperty(build, STATELESS_F_WIDGET_SYMBOL, { value: true })
  if (typeof displayName === 'string') {
    ;(build as unknown as { displayName: string }).displayName = displayName
  }
  return build as T & StatelessWidgetSymbol
}
export { defineStatelessWidget as stateless }

/**
 * 判断是否为无状态小部件
 *
 * @param {any} fn - 函数式组件
 * @returns {boolean} - true 表示为简单小部件
 */
export function isStatelessWidget(fn: any): fn is StatelessWidget {
  return typeof fn === 'function' && fn[STATELESS_F_WIDGET_SYMBOL] === true
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
export function isWidget(val: any): val is WidgetTypes {
  return typeof val === 'function'
}

/**
 * 获取组件名称的函数
 * @param widget - WidgetType 类型的组件对象，包含 displayName 和 name 属性
 * @returns 返回组件的显示名称，如果不存在则返回名称，如果都不存在则返回 'AnonymousWidget'
 */
export function getWidgetName(widget: WidgetTypes) {
  // 首先检查 displayName 是否为字符串且存在
  return widget.displayName || widget.name || 'anonymous'
}
