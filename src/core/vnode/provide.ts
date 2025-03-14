import { useCurrentInstance, Widget } from '../widget/index.js'
import type { VNode } from './types.js'
import { findParentVNode, getCurrentVNode } from './manager.js'

/**
 * 提供依赖数据，实现组件间的依赖注入
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
    throw new Error('App 是内部保留关键词，请勿使用！')
  }
  const currentVNode = instance?.['vnode'] || getCurrentVNode()
  if (!currentVNode) throw new Error('provide must be called in widget')
  if (!currentVNode.provide) {
    ;(currentVNode as VNode).provide = { [name]: value }
  } else {
    currentVNode.provide[name] = value
  }
}

/**
 * 注入祖先组件提供的依赖数据
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
      `[Vitarx.inject][ERROR]：未能获取上下文，inject只能在组件构造阶段获取到上下文或显式指定组件实例`
    )
  }
  // 从当前 VNode 向上查找父级 VNode，直到找到或没有父级
  let parentVNode: VNode | undefined = findParentVNode(currentVNode)
  while (parentVNode) {
    // 判断当前 VNode 是否包含提供的数据
    if (parentVNode.provide && name in parentVNode.provide) {
      return parentVNode.provide[name] // 找到数据则返回
    }
    // 获取父级 VNode
    parentVNode = findParentVNode(parentVNode)
  }
  // 如果没有找到数据，返回默认值
  return defaultValue
}
