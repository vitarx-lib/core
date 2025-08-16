import { popProperty } from '@vitarx/utils'
import { DomHelper } from '../../dom'
import type {
  Child,
  FragmentElement,
  IntrinsicNodeElementName,
  UniqueKey,
  VNodeProps
} from '../types'
import { CommentVNode } from './comment'
import { TextVNode } from './text'
import { VNode } from './vnode'
import { WidgetVNode } from './widget'

/**
 * ContainerElementVNode 类是一个抽象类，继承自 VNode 类
 * 用于表示可以包含子节点的虚拟节点，支持 HTML 元素、SVG 元素或片段节点
 * @typeParam T - 表示节点名称的类型，可以是内置节点元素名称或 'fragment-node'
 */
export abstract class ContainerVNode<
  T extends IntrinsicNodeElementName | 'fragment-node' = IntrinsicNodeElementName | 'fragment-node'
> extends VNode<T> {
  /**
   * 子节点列表
   */
  #children: VNode[]

  constructor(type: T, props: VNodeProps<T> | null = null, children: Child[] | null = null) {
    if (props && 'children' in props) {
      // 如果props中有children属性，合并到children
      const attrChildren = popProperty(props, 'children')
      if (attrChildren) {
        children = Array.isArray(attrChildren)
          ? [...attrChildren, ...(children ?? [])]
          : [attrChildren, ...(children ?? [])]
      }
    }
    super(type, props)
    this.#children = children ? this.#formatChildren(children) : []
  }

  /**
   * 获取节点的子节点列表
   *
   * @returns {VNode[]} 返回节点的子节点数组
   */
  get children(): VNode[] {
    return this.#children
  }

  /**
   * 渲染子节点的函数
   */
  protected renderChildren(): void {
    // 检查是否存在子节点并且目标元素具有children属性
    if (this.children.length && 'children' in this.element) {
      // 遍历所有子节点
      for (const child of this.children) {
        const el = child.element // 获取当前子节点的DOM元素
        // 检查子节点是否是WidgetVNode类型
        if (WidgetVNode.is(child)) {
          // 如果子节点有$teleport属性，将其附加到teleport目标
          if (child.teleport) {
            DomHelper.appendChild(child.teleport, child.shadowElement)
          } else {
            // 否则直接附加到当前节点的元素上
            DomHelper.appendChild(this.element, el)
          }
        } else {
          // 如果不是WidgetVNode类型，直接附加到当前节点的元素上
          DomHelper.appendChild(this.element, el)
        }
      }
    }
  }

  /**
   * 判断给定的虚拟节点是否为容器类型的虚拟节点
   * @param vnode - 需要检查的虚拟节点
   * @returns {boolean} 如果是容器类型的虚拟节点则返回true，否则返回false
   */
  static override is(vnode: VNode): vnode is ContainerVNode {
    // 检查vnode的类型是否为字符串，如果不是则直接返回false
    if (typeof vnode.type !== 'string') return false
    // 排除文本节点和注释节点
    if ('text-node' === vnode.type || 'comment-node' === vnode.type) return false
    // 通过以上检查后，确认是元素类型的虚拟节点，返回true
    return true
  }

  /**
   * @inheritDoc
   */
  override mount(container?: HTMLElement | SVGElement | FragmentElement): void {
    // 获取片段节点元素
    const element = this.element
    // 如果不是组件节点，将元素添加到容器中
    if (container) DomHelper.appendChild(container, element)
    for (const child of this.children) {
      // 遍历所有子组件
      child.mount() // 递归挂载每个子组件
    }
  }

  /**
   * @inheritDoc
   */
  override unmount(): void {
    for (const child of this.children) {
      child.unmount()
    }
    DomHelper.remove(this.element)
  }

  /**
   * 更新子节点数组的方法
   * @param nodes - 新的虚拟节点(VNode)数组，用于替换当前的子节点
   */
  updateChildren(nodes: VNode[]) {
    // 将传入的节点数组赋值给实例的私有属性 children
    this.#children = nodes
  }

  /**
   * 将子节点列表进行扁平化处理
   *
   * @private
   * @param target
   * @returns {VNode[]} 返回一个包含所有子节点的数组
   */
  #formatChildren(target: Child[] | Child): VNode[] {
    const childList: VNode[] = []
    // 用于检测重复key的集合
    const keySet = new Set<UniqueKey>()
    if (Array.isArray(target)) {
      target.forEach(item => {
        const itemChildren = this.#formatChildren(item)
        childList.push(...itemChildren)
      })
    } else {
      let vnode: VNode
      if (target instanceof VNode) {
        vnode = target
        // 检查key是否重复
        if ('key' in target && target.key) {
          if (keySet.has(target.key)) {
            console.warn(
              `[Vitarx.VNode][WARN]：Duplicate key: ${String(target.key)} detected, which can cause rendering errors or performance issues。`
            )
          } else {
            keySet.add(target.key)
          }
        }
      } else if ([false, undefined, null].includes(target as any)) {
        vnode = new CommentVNode(String(target))
      } else {
        // 文本节点
        vnode = new TextVNode(String(target))
      }
      childList.push(vnode)
      // 添加父映射
      VNode.addParentVNodeMapping(vnode, this)
    }
    return childList
  }
}
