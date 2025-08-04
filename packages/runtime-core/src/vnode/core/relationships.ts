import { getContext, runInContext } from '@vitarx/responsive'
import type { VNode, WidgetVNode } from '../types'
import { VNodeContextSymbol } from './constant'
import { isVNode } from './type-guards'

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
 * 获取当前组件对应的虚拟节点
 *
 * @alias useCurrentVNode
 * @returns {WidgetVNode | undefined} 如果不存在返回undefined
 */
export function getCurrentVNode(): WidgetVNode | undefined {
  return getContext<WidgetVNode>(VNodeContextSymbol)
}

export { getCurrentVNode as useCurrentVNode }

/**
 * 在指定虚拟节点的上下文中运行函数
 *
 * @template T - 函数返回值的类型
 * @param vnode - 虚拟节点
 * @param fn - 要运行的函数
 * @returns {T} 函数运行后的结果
 * @internal 内部核心逻辑
 */
export function runInVNodeContext<T>(vnode: VNode, fn: () => T): T {
  return runInContext(VNodeContextSymbol, vnode, fn)
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

/**
 * 挂载虚拟节点
 *
 * @param {VNode} vnode - 要挂载的虚拟节点
 * @returns {void}
 */
export function mountVNode(vnode: VNode): void {
  if (!isVNode(vnode)) return
  if ('instance' in vnode) {
    // 挂载当前节点
    vnode.instance?.renderer.mount()
  } else if ('children' in vnode && vnode.children.length) {
    // 递归挂载子级
    vnode.children.forEach(child => mountVNode(child))
  }
}

/**
 * 卸载虚拟节点
 *
 * @param {VNode} vnode - 要卸载的虚拟节点
 * @param {boolean} [isRemoveEl=true] - 是否删除元素，默认为true
 * @returns {void}
 */
export function unmountVNode(vnode: VNode, isRemoveEl: boolean = true): void {
  if (!isVNode(vnode)) return
  if ('instance' in vnode) {
    vnode.instance?.renderer.unmount(isRemoveEl)
  } else {
    if ('children' in vnode && vnode.children.length) {
      vnode.children.forEach(child => unmountVNode(child, isRemoveEl))
      // 删除元素
      if (isRemoveEl) vnode.el?.remove()
    }
  }
}
