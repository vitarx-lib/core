import { toRaw } from '@vitarx/responsive'
import type {
  AllHostElementNames,
  HostParentElement,
  MountType,
  NodeNormalizedProps
} from '../../types/index.js'
import { NodeState } from '../constants/index.js'
import { VNode } from './VNode.js'

/**
 * @template T - 运行时元素名称
 */
export abstract class HostNode<
  T extends AllHostElementNames = AllHostElementNames
> extends VNode<T> {
  /**
   * @inheritDoc
   */
  override mount(target?: HostParentElement, type?: MountType): void {
    const teleport = this.teleport
    if (teleport) {
      // 挂载到传送节点
      this.dom.appendChild(teleport, this.element)
    }
    // 获取片段节点元素
    const element = teleport ? this.anchor : this.element
    // 挂载到指定目标
    if (target) {
      switch (type) {
        case 'insertBefore':
          this.dom.insertBefore(element, target)
          break
        case 'insertAfter':
          this.dom.insertAfter(element, target)
          break
        case 'replace':
          this.dom.replace(element, target)
          break
        default:
          this.dom.appendChild(target, element)
      }
    }
    this.mountChildren?.()
    this.state = NodeState.Activated
  }
  /**
   * @inheritDoc
   */
  override unmount(root: boolean = true): void {
    this.unmountChildren?.()
    if (root) {
      this.removeAnchor()
      this.dom.remove(this.element)
    }
    this.state = NodeState.Unmounted
  }
  /**
   * @inheritDoc
   */
  override activate(root: boolean = true): void {
    if (root) this.toggleElement(true)
    this.activateChildren?.()
    this.state = NodeState.Activated
  }
  /**
   * @inheritDoc
   */
  override deactivate(root: boolean = true): void {
    this.deactivateChildren?.()
    if (root) this.toggleElement(false)
    this.state = NodeState.Deactivated
  }
  /**
   * 挂载子节点
   *
   * 此方法是可选的，如果元素不支持子节点，则不需要实现此方法。
   *
   * @protected
   */
  protected mountChildren?(): void
  /**
   * 卸载子节点
   *
   * 此方法是可选的，如果元素不支持子节点，则不需要实现此方法。
   *
   * @protected
   */
  protected unmountChildren?(): void
  /**
   * 激活子节点
   *
   * 此方法是可选的，如果元素不支持子节点，则不需要实现此方法。
   *
   * @protected
   */
  protected activateChildren?(): void
  /**
   * 停用子节点
   *
   * 此方法是可选的，如果元素不支持子节点，则不需要实现此方法。
   *
   * @protected
   */
  protected deactivateChildren?(): void
  /**
   * 规范化节点属性的受保护重写方法
   * @param props - 需要规范化的属性对象，键为字符串，值为任意类型
   * @returns {NodeNormalizedProps<T>} 返回规范化的有效节点属性对象
   */
  protected override normalizeProps(props: Record<string, any>): NodeNormalizedProps<T> {
    // 如果属性对象不为空（即存在属性键）
    if (Object.keys(props).length) {
      // 解包ref
      for (const prop in props) {
        props[prop] = toRaw(props[prop])
      }
    }
    return props as NodeNormalizedProps<T>
  }
  /**
   * 切换元素
   *
   * @param {boolean} isActive - 是否激活元素
   */
  private toggleElement(isActive: boolean): void {
    const teleport = this.teleport
    if (isActive) {
      teleport
        ? this.dom.appendChild(teleport, this.element)
        : this.dom.replace(this.element, this.anchor)
    } else {
      this.teleport ? this.dom.remove(this.element) : this.dom.replace(this.element, this.anchor)
    }
  }
}
