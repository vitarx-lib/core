import type { AnyFunction } from '@vitarx/utils'
import { VNode, WidgetVNode } from './nodes/index'

/**
 * 提供依赖数据，实现小部件间的依赖注入
 *
 * 该函数允许小部件向其所有子部件提供数据，形成依赖注入体系。子部件可通过 `inject` 函数获取祖先小部件提供的数据。
 *
 * @remarks
 * 在类小部件中使用时，只能是属性初始化值或 `constructor`、`onCreate`方法中使用
 *
 * @example
 * ```ts
 * // 在类小部件中
 * class MyWidget extends Widget {
 *   constructor(props) {
 *     super(props);
 *     provide('theme', 'dark');
 *   }
 *
 *   onMounted() {
 *     // 会抛出一个Error异常，因为此时已不在小部件的构造期内。
 *     provide('userData', { id: 1 });
 *   }
 * }
 * ```
 *
 * @param name - 依赖数据的唯一标识符，可以是字符串或Symbol
 * @param value - 要提供的数据值
 * @returns {void}
 * @throws {Error} 当名称为'App'时会抛出错误，因为这是内部保留关键词
 */
export function provide(name: string | symbol, value: any): void {
  if (name === 'App') {
    throw new Error('App 是内部保留关键词，请勿使用！')
  }
  const currentVNode = WidgetVNode.getCurrentVNode()
  if (!currentVNode) throw new Error('provide must be called in widget')
  currentVNode.provide(name, value)
}

/**
 * 依赖注入函数 - 基本用法
 *
 * @template T - 注入数据的类型
 * @param name - 要注入的依赖数据的唯一标识符，与provide中使用的标识符对应
 * @returns {T | undefined} - 注入的数据，如果找不到则返回 undefined
 */
export function inject<T>(name: string | symbol): T | undefined

/**
 * 依赖注入函数 - 带默认值
 *
 * @template T - 注入数据的类型
 * @param name - 要注入的依赖数据的唯一标识符，与provide中使用的标识符对应
 * @param defaultValue - 当找不到指定名称的依赖数据时返回的默认值
 * @returns {T} - 注入的数据或默认值
 */
export function inject<T>(name: string | symbol, defaultValue: T): T

/**
 * 依赖注入函数 - 明确指定默认值不作为工厂函数
 *
 * @template T - 注入数据的类型
 * @param name - 要注入的依赖数据的唯一标识符，与provide中使用的标识符对应
 * @param defaultValue - 当找不到指定名称的依赖数据时返回的默认值
 * @param treatDefaultAsFactory - 明确指定不将默认值作为工厂函数
 * @returns {T} - 注入的数据或默认值
 */
export function inject<T>(name: string | symbol, defaultValue: T, treatDefaultAsFactory: false): T

/**
 * 依赖注入函数 - 默认值作为工厂函数
 *
 * @template T - 注入数据的类型，必须是函数类型
 * @param name - 要注入的依赖数据的唯一标识符，与provide中使用的标识符对应
 * @param defaultValue - 当找不到指定名称的依赖数据时调用的工厂函数
 * @param treatDefaultAsFactory - 明确指定将默认值作为工厂函数
 * @returns {ReturnType<T>} - 工厂函数的返回值
 */
export function inject<T extends AnyFunction>(
  name: string | symbol,
  defaultValue: T,
  treatDefaultAsFactory: true
): ReturnType<T>

/**
 * 依赖注入函数 - 完整参数
 *
 * @remarks
 * 在类小部件中使用时，只能是属性初始化值或 `constructor`、`onCreate`方法中使用
 *
 * @template T - 注入数据的类型
 * @param name - 要注入的依赖数据的唯一标识符，与provide中使用的标识符对应
 * @param [defaultValue] - 当找不到指定名称的依赖数据时返回的默认值
 * @param [treatDefaultAsFactory=false] - 是否将默认值作为工厂函数
 * @returns {T} - 注入的数据或默认值
 * @throws - 当无法获取上下文时抛出错误
 */
export function inject<T>(
  name: string | symbol,
  defaultValue?: T,
  treatDefaultAsFactory?: boolean
): T {
  // 获取当前 VNode
  const currentVNode = WidgetVNode.getCurrentVNode()
  if (!currentVNode) {
    throw new Error(
      `[Vitarx.inject] [ERROR]: inject can only be used during widget constructor/onCreate`
    )
  }

  // 从当前 VNode 的父级开始查找
  let vnode: VNode | undefined = VNode.findParentVNode(currentVNode)
  // 缓存 App 实例
  let app = currentVNode.getProvide('App')

  while (vnode) {
    // 如果是 WidgetVNode 且包含提供的数据，直接返回
    if (WidgetVNode.is(vnode) && vnode.hasProvide(name)) {
      return vnode.getProvide(name) as T
    }

    // 更新 App 实例（如果当前 VNode 有提供）
    if (WidgetVNode.is(vnode)) {
      app = vnode.getProvide('App')
    }

    // 移动到父级 VNode
    vnode = VNode.findParentVNode(vnode)
  }

  // 如果没有在组件树中找到，尝试从 App 实例获取
  if (app) {
    const value = app.getProvide(name)
    if (value !== undefined) return value
  }

  // 处理默认值工厂函数
  if (typeof defaultValue === 'function' && treatDefaultAsFactory) {
    return defaultValue()
  }

  // 返回默认值
  return defaultValue as T
}
