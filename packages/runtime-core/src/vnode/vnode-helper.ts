import { Observer, toRaw } from '@vitarx/responsive'
import { DomHelper } from '../dom'
import { CommentVNode, ContainerVNode, FragmentVNode, TextVNode, VNode, WidgetVNode } from './nodes'

export class VNodeHelper {
  /**
   * 用于更新虚拟DOM节点的patch方法
   * @param oldVNode - 旧的虚拟DOM节点
   * @param newVNode - 新的虚拟DOM节点
   * @param autoMount - 是否自动挂载，默认为true
   * @returns 更新后的虚拟DOM节点
   */
  static patchUpdate(oldVNode: VNode, newVNode: VNode, autoMount = true) {
    // 如果新旧节点的类型或key不同，则替换整个节点
    if (oldVNode.type !== newVNode.type || oldVNode.key !== newVNode.key) {
      // 替换旧节点为新节点
      this.replace(newVNode, oldVNode, autoMount)
      return newVNode
    } else {
      // 更新节点的属性
      this.patchUpdateAttrs(oldVNode, newVNode)
      // 如果是容器节点，则更新其子节点
      if (ContainerVNode.is(oldVNode)) {
        // 递归更新子节点并获取更新后的子节点列表
        const newChildren = this.patchUpdateChildren(oldVNode, newVNode as ContainerVNode)
        // 更新当前节点的子节点列表
        oldVNode.updateChildren(newChildren)
      }
      // 返回更新后的旧节点
      return oldVNode
    }
  }

  /**
   * 更新虚拟节点的属性
   * @param oldVNode - 旧的虚拟节点
   * @param newVNode - 新的虚拟节点
   * @template T - 继承自VNode的泛型类型
   */
  static patchUpdateAttrs<T extends VNode>(oldVNode: T, newVNode: T) {
    // 如果是特殊的无props节点，则不进行任何更新
    if (['comment-node', 'text-node', 'fragment-node'].includes(oldVNode.type as any)) return
    const isWidget = WidgetVNode.is(oldVNode) // 判断是否是Widget类型的节点
    const el = oldVNode.element as HTMLElement // 获取DOM元素
    // 旧的属性
    const oldAttrs = toRaw(oldVNode.props) as Record<string, any>
    // 新的属性
    const newAttrs = newVNode.props as Record<string, any>
    const keysToDelete = new Set(Object.keys(oldAttrs)) // 需要删除的属性键集合
    const changedAttrs: string[] = [] // 发生变化的属性数组
    // 遍历 newAttrs，检查是否有新的属性或属性值需要更新
    for (const key in newAttrs) {
      // 更新或新增属性
      if (oldAttrs[key] !== newAttrs[key]) {
        if (isWidget) {
          changedAttrs.push(key) // 如果是Widget类型的节点，记录变化的属性
        } else {
          DomHelper.setAttribute(el, key, newAttrs[key], oldAttrs[key]) // 设置DOM属性
        }
        oldAttrs[key] = newAttrs[key] // 更新旧属性值
      }
      // 将存在于新Attrs的键从 keysToDelete 中删除
      keysToDelete.delete(key)
    }
    // 遍历要删除的键集合，并删除对应的属性
    for (const key of keysToDelete) {
      if (isWidget) {
        changedAttrs.push(key) // 如果是Widget类型的节点，记录变化的属性
      } else {
        DomHelper.removeAttribute(el, key, oldAttrs[key]) // 移除DOM属性
      }
      delete oldAttrs[key] // 删除旧属性
    }
    // 如果有属性值改变，触发属性监听器
    if (changedAttrs.length > 0) Observer.notify(oldVNode.props, changedAttrs)
  }

  /**
   * 更新子节点的核心方法
   * @param oldVNode - 旧的虚拟DOM节点
   * @param newVNode - 新的虚拟DOM节点
   * @returns {VNode[]} 更新后的子节点数组
   */
  static patchUpdateChildren<T extends ContainerVNode>(oldVNode: T, newVNode: T): VNode[] {
    const oldChildren = oldVNode.children // 旧子节点列表
    const newChildren = newVNode.children // 新子节点列表
    /** 是否为片段节点 */
    const isFragment = FragmentVNode.is(oldVNode)

    // 处理边缘情况：新增全部子节点
    if (newChildren.length && !oldChildren.length) {
      newVNode.children.forEach(child => {
        child.mount(oldVNode.element) // 挂载所有新子节点
      })
      return newChildren // 返回新子节点列表
    }
    // 删除全部子节点
    if (!newChildren.length && oldChildren.length) {
      if (isFragment) {
        // 如果是片段节点，将第一个子节点插入到shadowElement之前
        DomHelper.insertBefore(oldVNode.shadowElement, oldVNode.children[0].element)
      }
      oldVNode.unmount() // 卸载旧节点
      return newChildren // 返回空的新子节点列表
    }

    // 创建旧节点的key映射表，用于快速查找具有相同key的节点
    const oldKeyToVNode = this.#createOldKeyToVNodeMap(oldChildren)

    // 被删除的节点集合
    const removedNodes = new Set(oldVNode.children)
    // 新子节点列表，未挂载！
    const newChildrenNotMounted: VNode[] = []

    // 根据新列表长度开始遍历
    for (let index = 0; index < newChildren.length; index++) {
      // 旧子节点，可能没有旧子节点
      const oldChild = oldVNode.children[index]
      // 新子节点
      const newChild = newVNode.children[index]
      // 尝试复用具有相同key的节点
      if (VNode.is(newChild) && oldKeyToVNode.has(newChild.key)) {
        const oldSameKeyChild = oldKeyToVNode.get(newChild.key)!
        if (oldSameKeyChild.vnode.type === newChild.type) {
          // 避免复用节点被删除
          removedNodes.delete(oldSameKeyChild.vnode)
          // 删除映射，一个key只对应一个节点，避免重复的key造成遗漏节点
          oldKeyToVNode.delete(newChild.key)
          // 替换到新节点列表中
          newChildren[index] = oldSameKeyChild.vnode
          // 只更新属性
          this.patchUpdateAttrs(oldSameKeyChild.vnode, newChild)
          const el = oldSameKeyChild.vnode.element
          // 如果旧父节点是片段节点
          if (isFragment) {
            const preEl = oldVNode.children[index - 1]?.element
            if (preEl) {
              // 往片段节点的最后一个元素之后插入新元素
              DomHelper.insertAfter(el, preEl)
            } else {
              // 不存在前一个元素则代表着是空片段节点，直接用新元素替换掉占位元素
              DomHelper.replace(el, oldVNode.shadowElement)
            }
          } else {
            DomHelper.appendChild(oldVNode.element, el)
          }
        }
        continue
      }

      // 处理新增节点
      if (!oldChild) {
        // 如果旧父节点是片段节点
        if (isFragment) {
          const el = newChild.element
          const preEl = oldVNode.children[index - 1]?.element
          if (preEl) {
            // 往片段节点的最后一个元素之后插入新元素
            DomHelper.insertAfter(el, preEl)
          } else {
            // 不存在前一个元素则代表着是空片段节点，直接用新元素替换掉占位元素
            DomHelper.replace(el, oldVNode.shadowElement)
          }
        } else {
          // 其他容器父节点直接渲挂载到父节点
          DomHelper.appendChild(oldVNode.element, newChild.element)
        }
        newChildrenNotMounted.push(newChild)
        continue
      }
      // 更新特殊节点：文本节点和注释节点
      if (
        (TextVNode.is(oldChild) && TextVNode.is(newChild)) ||
        (CommentVNode.is(oldChild) && CommentVNode.is(newChild))
      ) {
        if (oldChild.value !== newChild.value) {
          oldChild.value = newChild.value
          oldChild.element.nodeValue = newChild.value
        }
        // 取消标记旧节点为删除
        removedNodes.delete(oldChild)
        newChildren[index] = oldChild
        continue
      }

      // 更新常规虚拟节点
      if (VNode.is(oldChild) && VNode.is(newChild)) {
        const updatedNewChild = this.patchUpdate(oldChild, newChild, false)
        // 如果更新后的虚拟节点和旧虚拟节点相同，则取消将旧节点标记为删除
        if (updatedNewChild === oldChild) {
          newChildren[index] = oldChild
          removedNodes.delete(oldChild)
        } else {
          newChildrenNotMounted.push(updatedNewChild)
        }
        continue
      }

      // 替换不同类型的节点
      this.replace(newChild, oldChild, false)
      newChildrenNotMounted.push(newChild)
    }

    // 清理和挂载
    removedNodes.forEach(vnode => vnode.unmount())
    newChildrenNotMounted.forEach(vnode => vnode.mount())
    return newChildren
  }

  /**
   * 新节点替换旧节点
   * @param newVNode - 新的虚拟节点
   * @param oldVNode - 旧的虚拟节点
   * @param [autoMount=true] - 自动触发挂载钩子
   * @protected
   */
  static replace(newVNode: VNode, oldVNode: VNode, autoMount: boolean = true): VNode {
    // 预先渲染节点
    const newElement = newVNode.element
    // 渲染新节点
    // 如果新节点是传送节点则特殊处理
    if (WidgetVNode.is(newVNode) && newVNode.teleport) {
      // 新占位节点
      const newShadowElementEl = newVNode.shadowElement
      // 如果旧节点是传送节点
      if (WidgetVNode.is(oldVNode) && oldVNode.teleport) {
        // 新节点的占位元素替换旧节点占位元素
        DomHelper.replace(newShadowElementEl, oldVNode.shadowElement)
      } else {
        // 旧节点不是传送节点
        // 将新传送节点占位元素插入到旧节点之前
        DomHelper.insertBefore(newElement, oldVNode.element)
      }
      if (autoMount) {
        // 卸载旧节点
        oldVNode.unmount()
        // 挂载新节点
        newVNode.mount()
      }
      return newVNode
    }
    // 替换文本节点
    if (TextVNode.is(oldVNode) || CommentVNode.is(oldVNode)) {
      const parent = DomHelper.getParentElement(oldVNode.element)
      if (!parent) {
        throw new Error(
          'The old node that is replaced is not mounted, and the container element instance cannot be obtained, and the replacement operation cannot be completed.'
        )
      }
      DomHelper.replace(newElement, oldVNode.element)
      if (autoMount) newVNode.mount()
      return newVNode
    }
    if (WidgetVNode.is(oldVNode)) {
      // 如果旧节点是传送节点
      if (oldVNode.teleport) {
        // 将新元素替换掉旧节点的传送占位元素
        DomHelper.replace(newElement, oldVNode.shadowElement)
      } else {
        // 不是占位节点
        // 将新元素插入到旧元素之前，兼容卸载动画
        DomHelper.insertBefore(newElement, oldVNode.element)
      }
    } else {
      DomHelper.replace(newElement, oldVNode.element)
    }
    if (autoMount) {
      // 卸载旧节点
      oldVNode.unmount()
      // 挂载新节点
      oldVNode.mount()
    }
    return newVNode
  }

  /**
   * 创建旧节点的key映射表
   *
   * @param oldChildren - 旧子节点列表
   * @returns - key到节点的映射表
   */
  static #createOldKeyToVNodeMap(oldChildren: VNode[]): Map<any, { index: number; vnode: VNode }> {
    const oldKeyToVNode = new Map<any, { index: number; vnode: VNode }>()
    for (let i = 0; i < oldChildren.length; i++) {
      const child = oldChildren[i]
      if (VNode.is(child) && (child.key || child.key === 0)) {
        oldKeyToVNode.set(child.key, { index: i, vnode: child })
      }
    }
    return oldKeyToVNode
  }
}
