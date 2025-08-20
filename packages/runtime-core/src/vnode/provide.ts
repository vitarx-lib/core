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
 * 依赖注入函数
 *
 * @template T - 泛型类型，表示依赖项的类型
 * @param {string | symbol} name - 依赖项的名称，可以是字符串或符号
 * @returns {T | undefined} 返回类型为T的依赖项，如果未找到则返回undefined
 */
export function inject<T>(name: string | symbol): T | undefined
/**
 * 依赖注入函数
 *
 * @template T - 泛型类型，表示注入值的类型
 * @param name - 依赖的名称，可以是字符串或符号
 * @param defaultValue - 当找不到对应依赖时返回的默认值
 * @returns {T} 返回找到的依赖值或默认值
 */
export function inject<T>(name: string | symbol, defaultValue: T): T
/**
 * 依赖注入函数
 *
 * @remarks
 * 在类小部件中使用时，只能是属性初始化值或 `constructor`、`onCreate`方法中使用
 *
 * @template T - 注入数据的类型
 * @param name - 要注入的依赖数据的唯一标识符，与provide中使用的标识符对应
 * @param [defaultValue] - 当找不到指定名称的依赖数据时返回的默认值
 * @returns {T} - 注入的数据或默认值
 * @throws - 当无法获取上下文时抛出错误
 */
export function inject<T>(name: string | symbol, defaultValue?: T): T {
  // 如果没有提供实例，则使用当前实例
  const currentVNode = WidgetVNode.getCurrentVNode()
  // 如果没有虚拟节点，抛出错误
  if (!currentVNode) {
    throw new Error(
      `[Vitarx.inject][ERROR]：未能获取上下文，inject只能在小部件构造阶段获取到上下文或显式指定小部件实例`
    )
  }
  let app = currentVNode.getProvide('App')
  // 从当前 VNode 向上查找父级 VNode，直到找到或没有父级
  let parentVNode = VNode.findParentVNode(currentVNode)
  while (parentVNode) {
    if (WidgetVNode.is(parentVNode)) {
      // 判断当前 VNode 是否包含提供的数据
      if (parentVNode.hasProvide(name)) {
        // 如果包含，返回提供的数据
        return parentVNode.getProvide(name) as T
      }
      app = parentVNode.getProvide('App')
    }
    // 获取父级 VNode，并更新 parentVNode 变量
    parentVNode = VNode.findParentVNode(parentVNode)
  }
  if (!parentVNode) {
    const app = currentVNode.getProvide('App')
    if (app) return app.inject(name, defaultValue)
  }
  // 如果没有找到数据，返回默认值
  return defaultValue as T
}
