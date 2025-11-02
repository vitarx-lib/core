import { unref } from '@vitarx/responsive'
import { logger, popProperty } from '@vitarx/utils'
import type {
  ContainerNodeType,
  HostElementInstance,
  RuntimeVNodeChildren,
  UniqueKey,
  VNodeChild,
  VNodeInputProps
} from '../../types/index.js'
import { CommentNode, TextNode } from '../nodes/index.js'
import { linkParentNode } from '../runtime/index.js'
import { isVNode } from '../utils/index.js'
import { HostNode } from './HostNode.js'
import { VNode } from './VNode.js'

/**
 * ContainerNode 类是一个抽象类，继承自 VNode 类，用于表示可以包含子节点的虚拟节点。
 * 所有支持children属性的节点都可以继承该类。
 *
 * 核心功能：
 * - 管理子节点的生命周期（挂载、激活、卸载等）
 * - 处理子节点的渲染和格式化
 * - 提供子节点的key重复检查机制
 *
 * 构造函数参数：
 * @param type - 节点类型
 * @param props - 节点属性，可以包含children属性
 *
 * 特殊说明：
 * - 这是一个抽象类，子类必须实现createElement方法
 * - 子节点的key重复会触发警告，但不会阻止渲染
 * - 支持嵌套数组节点的扁平化处理
 */
export abstract class ContainerNode<
  T extends ContainerNodeType = ContainerNodeType
> extends HostNode<T> {
  /**
   * 子节点列表
   */
  public children: RuntimeVNodeChildren

  constructor(type: T, props: VNodeInputProps<T>) {
    const children = unref(popProperty(props, 'children'))
    super(type, props)
    // 如果存在children属性，则格式化子节点
    this.children = Array.isArray(children) ? this.formatChildren(children) : []
  }

  /**
   * @inheritDoc
   */
  protected override unmountChildren(): void {
    for (const child of this.children) {
      child.unmount(false)
    }
  }

  /**
   * @inheritDoc
   */
  protected override activateChildren(): void {
    // 遍历所有子节点
    for (let i = 0; i < this.children.length; i++) {
      // 递归调用更新每个子节点的激活状态
      this.children[i].activate(false)
    }
  }

  /**
   * @inheritDoc
   */
  protected override deactivateChildren() {
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].deactivate(false)
    }
  }

  /**
   * @inheritDoc
   */
  protected override mountChildren() {
    // 遍历挂载所有子节点
    for (const child of this.children) {
      child.mount()
    }
  }

  /**
   * @inheritDoc
   */
  override render(): HostElementInstance<T> {
    const selfElement = this.createElement()
    // 检查是否存在子节点
    if (this.children.length) {
      // 渲染所有子节点
      for (const child of this.children) {
        // 预先渲染元素
        const childElement = child.element
        // 如果是传送节点，则将影子元素添加到当前元素中
        const mountElement = child.teleport ? child.anchor : childElement
        this.dom.appendChild(selfElement, mountElement)
      }
    }
    return selfElement
  }

  /**
   * 创建元素实例
   *
   * 子类必须实现此方法
   *
   * @protected
   */
  protected abstract createElement(): HostElementInstance<T>

  /**
   * 扁平化并标准化子节点 (迭代优化版)
   *
   * @private
   * @param target
   * @returns {VNode[]} 返回一个包含所有子节点的数组
   */
  private formatChildren(target: VNodeChild): RuntimeVNodeChildren {
    const keySet = new Set<UniqueKey>()
    const childList: VNode[] = []
    const stack: VNodeChild[] = [unref(target)]

    while (stack.length > 0) {
      const current = stack.pop()!
      if (Array.isArray(current)) {
        // 逆序压栈以保持顺序
        for (let i = current.length - 1; i >= 0; i--) {
          stack.push(unref(current[i]))
        }
      } else {
        const vnode = this.normalizeChild(current, keySet)
        linkParentNode(vnode, this)
        childList.push(vnode)
      }
    }

    return childList
  }

  /**
   * 将单个节点转换为 VNode
   */
  private normalizeChild(current: unknown, keySet: Set<UniqueKey>): VNode {
    if (current == null || typeof current === 'boolean') {
      return new CommentNode({ value: String(current) })
    }

    if (isVNode(current)) {
      this.checkDuplicateKey(current, keySet)
      return current
    }

    return new TextNode({ value: String(current) })
  }

  /**
   * 检查 VNode 的 key 是否重复
   */
  private checkDuplicateKey(vnode: VNode, keySet: Set<UniqueKey>): void {
    if (vnode.key == null) return
    if (keySet.has(vnode.key)) {
      logger.warn(
        `Duplicate key ${String(vnode.key)} detected, which can cause rendering errors or performance issues`,
        vnode.devInfo?.source
      )
    } else {
      keySet.add(vnode.key)
    }
  }
}
