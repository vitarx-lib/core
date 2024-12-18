import { Widget } from '../widget/index.js'
import type { VNode } from './type.js'
import { findParentVNode, getCurrentVNode } from './relational.js'

/**
 * 提供数据
 *
 * @param name - 提供数据的名称
 * @param value - 提供的数据
 * @param instance - 组件实例，函数式组件无需提供，类组件必须传入当前组件实例`this`
 */
export function provide(name: string | symbol, value: any, instance?: Widget): void {
  const currentVNode = instance?.vnode || getCurrentVNode()
  if (!currentVNode) throw new Error('provide must be called in widget')
  if (!currentVNode.provide) currentVNode.provide = {}
  currentVNode.provide[name] = value
}

/**
 * 注入上级提供的数据
 *
 * @param name - 提供数据的名称
 * @param defaultValue - 默认值
 * @param instance - 组件实例，函数式组件无需提供，类组件必须传入当前组件实例`this`
 */
export function inject<T = any>(
  name: string | symbol,
  defaultValue: T = undefined as T,
  instance?: Widget
): T {
  const currentVNode = instance?.vnode || getCurrentVNode()
  if (!currentVNode) {
    if (instance) {
      throw new Error(
        `[Vitarx.inject][ERROR]：未能获取上下文，未提供instance参数时，只能在函数式小部件的顶层作用域中调用才能生效`
      )
    }
    throw new Error(
      `[Vitarx.inject][ERROR]：未能获取上下文，请检查instance参数是否正确，它必须是Widget派生类的实例`
    )
  }
  // 从当前 VNode 向上查找父级 VNode，直到找到或没有父级
  let parentVNode: VNode | undefined = currentVNode
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
