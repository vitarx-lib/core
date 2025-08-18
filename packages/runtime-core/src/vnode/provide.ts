import { useCurrentInstance, Widget } from '../widget'
import { VNode, WidgetVNode } from './nodes/index'

/**
 * 提供依赖数据，实现小部件间的依赖注入
 *
 * 该函数允许小部件向其所有子部件提供数据，形成依赖注入体系。子部件可通过 `inject` 函数获取祖先小部件提供的数据。
 *
 * @remarks
 * 在类小部件中使用时，第三个参数 `instance` 需要特别注意：
 * - 在 `constructor` 或 `onBeforeCreate` 方法中调用时，可以省略 `this` 参数
 * - 在其他生命周期钩子或方法中调用时，必须传入 `this` 作为 `instance` 参数
 * - 这是因为只有在小部件构造阶段才能自动获取到关联的上下文
 *
 * @example
 * ```ts
 * // 在类小部件中
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
 * @param [instance] - 实例，在非构造阶段必须提供实例
 * @returns {void}
 */
export function provide(name: string | symbol, value: any, instance?: Widget): void {
  if (name === 'App') {
    throw new Error('App 是内部保留关键词，请勿使用！')
  }
  const currentVNode = instance?.$vnode || WidgetVNode.getCurrentVNode()
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
 * @param [instance] - 可选参数，指定从哪个实例中获取依赖
 * @returns {T} 返回找到的依赖值或默认值
 */
export function inject<T>(name: string | symbol, defaultValue: T, instance?: Widget): T
/**
 * 依赖注入函数
 *
 * @remarks
 * 在类小部件中使用时，第三个参数 `instance` 需要特别注意：
 * - 在 `constructor` 或 `onCreate` 方法中调用时，可以省略 `this` 参数
 * - 在其他生命周期钩子或方法中调用时，必须传入 `this` 作为 `instance` 参数
 * - 函数式小部件中无需提供 `instance` 参数
 *
 * @example
 * ```ts
 * // 在类小部件中
 * class MyWidget extends Widget {
 *   constructor(props) {
 *     super(props);
 *     // 构造函数中可以省略this
 *     const theme = inject('theme', 'light');
 *   }
 *
 *   onMounted() {
 *     // 其他方法中必须传入this
 *     const userData = inject('userData', {}, this);
 *   }
 * }
 *
 * // 在函数式小部件中
 * function MyFunctionalWidget(props) {
 *   // 函数式小部件中直接调用，无需提供instance
 *   const theme = inject('theme', 'light');
 *   return <div className={theme}>...</div>;
 * }
 * ```
 *
 * @template T - 注入数据的类型
 * @param name - 要注入的依赖数据的唯一标识符，与provide中使用的标识符对应
 * @param [defaultValue] - 当找不到指定名称的依赖数据时返回的默认值
 * @param [instance] - 小部件实例，函数式小部件无需提供，类小部件在非构造阶段必须传入当前小部件实例`this`
 * @returns {T} - 注入的数据或默认值
 * @throws - 当无法获取上下文时抛出错误
 */
export function inject<T>(name: string | symbol, defaultValue?: T, instance?: Widget): T {
  // 如果没有提供实例，则使用当前实例
  instance ??= useCurrentInstance()
  // 获取当前组件的虚拟节点
  const currentVNode = instance?.$vnode
  // 如果没有虚拟节点，抛出错误
  if (!currentVNode) {
    throw new Error(
      `[Vitarx.inject][ERROR]：未能获取上下文，inject只能在小部件构造阶段获取到上下文或显式指定小部件实例`
    )
  }
  // 从当前 VNode 向上查找父级 VNode，直到找到或没有父级
  let parentVNode = VNode.findParentVNode(currentVNode) as WidgetVNode | undefined
  while (parentVNode) {
    // 判断当前 VNode 是否包含提供的数据
    if (parentVNode.hasProvide(name)) {
      // 如果包含，返回提供的数据
      return parentVNode.getProvide(name) as T
    }
    // 获取父级 VNode
    parentVNode = VNode.findParentVNode(currentVNode) as WidgetVNode | undefined
  }
  // 如果没有找到数据，返回默认值
  return defaultValue as T
}
