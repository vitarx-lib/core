import { toRaw } from '@vitarx/responsive'
import { popProperty } from '@vitarx/utils'
import { DomHelper } from '../../dom/index.js'
import { isContainerVNode } from '../guards.js'
import type {
  Child,
  FragmentNodeElementName,
  IntrinsicNodeElementName,
  MountType,
  UniqueKey,
  VNodeProps
} from '../types/index.js'
import { CommentVNode } from './comment.js'
import { TextVNode } from './text.js'
import { VNode } from './vnode.js'

type ContainerVNodeType = IntrinsicNodeElementName | FragmentNodeElementName
/**
 * ContainerElementVNode 类是一个抽象类，继承自 VNode 类
 * 用于表示可以包含子节点的虚拟节点，支持 HTML 元素、SVG 元素或片段节点
 * @typeParam T - 表示节点名称的类型，可以是内置节点元素名称或 'fragment-node'
 */
export abstract class ContainerVNode<
  T extends ContainerVNodeType = ContainerVNodeType
> extends VNode<T> {
  #children: VNode[]

  constructor(type: T, props: VNodeProps<T> | null = null) {
    super(type, props)
    // 如果存在children属性，则格式化子节点
    this.#children =
      'children' in this.props ? this.#formatChildren(popProperty(this.props, 'children')) : []
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
   * 判断给定的值是否为容器类型的虚拟节点
   * @param val - 需要检查的虚拟节点
   * @returns {boolean} 如果是容器类型的虚拟节点则返回true，否则返回false
   */
  static override is(val: any): val is ContainerVNode {
    return isContainerVNode(val)
  }

  /**
   * @inheritDoc
   */
  override mount(target?: Node, type?: MountType): void {
    // 获取片段节点元素
    let element = this.element as Node
    // 遍历挂载所有子节点
    for (const child of this.children) {
      child.mount(this.element, 'appendChild')
    }
    if (this.teleport) {
      // 挂载到传送节点
      DomHelper.appendChild(this.teleport, element)
      element = this.shadowElement
    }
    if (target) {
      switch (type) {
        case 'insertBefore':
          DomHelper.insertBefore(element, target)
          break
        case 'insertAfter':
          DomHelper.insertAfter(element, target)
          break
        case 'replace':
          DomHelper.replace(element, target)
          break
        default:
          DomHelper.appendChild(target, element)
      }
    }
  }

  /**
   * 渲染子节点的函数
   */
  protected renderChildren(): void {
    const currentEl = this.element
    // 检查是否存在子节点并且目标元素具有children属性
    if (this.children.length && 'children' in currentEl) {
      // 渲染所有子节点
      for (const child of this.children) {
        child.render()
      }
    }
  }

  /**
   * 替换子节点列表
   * @param nodes - 新的虚拟节点(VNode)数组，用于替换当前的子节点
   */
  replaceChildren(nodes: VNode[]) {
    if (!Array.isArray(nodes)) {
      throw new Error('[Vitarx.ContainerVNode][ERROR]：Children must be an array.')
    }
    // 将传入的节点数组赋值给实例的私有属性 children
    this.#children = nodes
  }

  /**
   * 将子节点列表进行扁平化处理
   *
   * @private
   * @param target
   * @param keySet 用于检测重复key的集合
   * @returns {VNode[]} 返回一个包含所有子节点的数组
   */
  #formatChildren(target: Child[] | Child, keySet: Set<UniqueKey> = new Set<UniqueKey>()): VNode[] {
    const childList: VNode[] = []

    if (Array.isArray(target)) {
      for (const item of target) {
        const itemChildren = this.#formatChildren(toRaw(item), keySet)
        childList.push(...itemChildren)
      }
    } else {
      let vnode: VNode
      const rawTarget = toRaw(target)
      if (rawTarget === false || rawTarget === undefined || rawTarget === null) {
        if (import.meta.env.DEV) {
          vnode = new CommentVNode(String(rawTarget))
        } else {
          vnode = new TextVNode('')
        }
      } else if (VNode.is(rawTarget)) {
        vnode = rawTarget
        // 检查key是否重复
        if ('key' in rawTarget && rawTarget.key) {
          if (keySet.has(rawTarget.key)) {
            console.warn(
              `[Vitarx.VNode][WARN]：Duplicate key: ${String(rawTarget.key)} detected, which can cause rendering errors or performance issues。`
            )
          } else {
            keySet.add(rawTarget.key)
          }
        }
      } else {
        // 文本节点
        vnode = new TextVNode(String(rawTarget))
      }
      childList.push(vnode)
      // 添加父映射
      VNode.addParentVNodeMapping(vnode, this)
    }

    return childList
  }

  /**
   * @inheritDoc
   */
  override activate(root: boolean = true): void {
    if (root) this.toggleElement(true)
    // 遍历所有子节点
    for (let i = 0; i < this.children.length; i++) {
      // 递归调用更新每个子节点的激活状态
      this.children[i].activate(false)
    }
  }

  /**
   * @inheritDoc
   */
  override deactivate(root: boolean = true) {
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].deactivate(false)
    }
    if (root) {
      this.toggleElement(false)
    } else if (this.teleport) {
      // 不是根且是传送节点，也需要移除
      DomHelper.remove(this.element)
    }
  }
}
