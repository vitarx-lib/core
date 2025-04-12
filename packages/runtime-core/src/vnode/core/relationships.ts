import { getContext } from '@vitarx/responsive'
import type { VNode, WidgetVNode } from '../types'
import { VNodeContextSymbol } from './constant'

/**
 * 存储节点父子关系的映射
 * @private
 */
const parentNodeMapping = new WeakMap<VNode, VNode>()

/**
 * 存储节点卸载回调函数的集合
 * @private
 */
const unmountListens = new WeakMap<VNode, Set<AnyCallback>>()

/**
 * 获取当前正在实例化的Widget节点
 *
 * @returns {WidgetVNode | undefined} 当前Widget节点，如果不在Widget上下文中则返回undefined
 */
export function getCurrentVNode(): WidgetVNode | undefined {
  return getContext<WidgetVNode>(VNodeContextSymbol)
}

/**
 * 添加父节点映射关系
 *
 * @param {VNode} vnode - 子节点
 * @param {VNode} parent - 父节点
 * @returns {void}
 */
export function addParentVNodeMapping(vnode: VNode, parent: VNode): void {
  parentNodeMapping.set(vnode, parent)
}

/**
 * 查找父节点
 *
 * @param {VNode} vnode - 自身虚拟节点对象
 * @return {VNode|undefined} - 如果存在父节点则返回父节点的VNode对象
 */
export function findParentVNode(vnode: VNode): VNode | undefined {
  return parentNodeMapping.get(vnode)
}

/**
 * 监听节点销毁事件
 *
 * @param {VNode} vnode - 要监听的虚拟节点
 * @param {VoidCallback} cb - 节点销毁时执行的回调函数
 * @returns {void}
 */
export function onDestroyed(vnode: VNode, cb: VoidCallback): void {
  if (!unmountListens.has(vnode)) {
    unmountListens.set(vnode, new Set())
  }
  unmountListens.get(vnode)!.add(cb)
}

/**
 * 销毁节点
 *
 * 框架内部核心方法，请勿外部调用！
 *
 * @param vnode - vnode
 * @internal
 */
export function destroyVNode(vnode: VNode) {
  const listens = unmountListens.get(vnode)
  if (listens) {
    listens.forEach(cb => cb())
    listens.clear()
    unmountListens.delete(vnode)
  }
}
