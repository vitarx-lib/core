import { markNonSignal } from '@vitarx/responsive'
import type {
  AllHostElementNames,
  BindParentElement,
  HostElementInstance,
  HostParentElement,
  MountType,
  NodeNormalizedProps
} from '../../types/index.js'
import { NodeState } from '../constants/index.js'
import { unwrapRefProps } from '../utils/unwrapRefProps.js'
import { VNode } from './VNode.js'

/**
 * HostNode是一个抽象基类，用于表示宿主环境中的DOM节点。它继承自VNode，并提供了节点挂载、卸载、激活和停用等核心功能。
 *
 * 核心功能：
 * - 节点的挂载和卸载
 * - 节点的激活和停用
 * - 子节点的生命周期管理
 * - 属性规范化处理
 *
 * 使用示例：
 * ```typescript
 * class CustomHostNode extends HostNode<'div'> {
 *   protected mountChildren(): void {
 *     // 实现子节点挂载逻辑
 *   }
 * }
 *
 * const node = new CustomHostNode();
 * node.mount(targetElement);
 * ```
 *
 * 构造函数参数：
 * - 无直接构造函数参数，通过泛型T指定节点类型
 *
 * 特殊限制：
 * - 这是一个抽象类，不能直接实例化
 * - 子类需要根据需要实现可选的生命周期方法
 * - 使用teleport功能时需要额外注意节点位置的维护
 *
 * @template T - 运行时元素名称
 */
export abstract class HostNode<
  T extends AllHostElementNames = AllHostElementNames
> extends VNode<T> {
  /**
   * 缓存的元素
   *
   * @protected
   */
  private _cachedElement: HostElementInstance<T> | null = null
  /**
   * @inheritDoc
   */
  override mount(target?: HostParentElement, type?: MountType): void {
    const teleport = this.teleport
    let element: HostElementInstance = this.element
    if (teleport) {
      // 挂载真实元素到 teleport 目标
      this.dom.appendChild(teleport, this.element)
      // 在原文档位置保留 anchor 作为占位
      element = this.anchor
    }
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
   * 获取或创建运行时元素实例的访问器属性
   *
   * 使用惰性初始化模式，只在第一次访问时创建元素实例
   * 并将创建的实例缓存起来，后续访问直接返回缓存的实例
   *
   * @returns {HostElementInstance<T>} 返回运行时元素实例
   */
  get element(): HostElementInstance<T> {
    // 检查是否已经缓存了元素实例
    if (!this._cachedElement) {
      if (this.state === NodeState.Created) this.state = NodeState.Rendered
      // 如果没有缓存，则创建新的元素实例并缓存
      return (this._cachedElement = markNonSignal(this.render()))
    }
    // 如果已经缓存，则直接返回缓存的实例
    return this._cachedElement
  }
  /**
   * @inheritDoc
   */
  override unmount(root: boolean = true): void {
    this.unmountChildren?.()
    if (root) {
      this.dom.remove(this.element)
    } else if (this.teleport) {
      this.dom.remove(this.element)
    }
    this.removeAnchor()
    this._cachedElement = null
    this.state = NodeState.Unmounted
  }
  /**
   * @inheritDoc
   */
  override setTeleport(teleport: BindParentElement): void {
    const oldTeleport = this.teleport
    super.setTeleport(teleport)
    const newTeleport = this.teleport // 获取更新后的teleport元素
    // 如果不是活跃状态则直接返回
    if (this.state !== NodeState.Activated) return
    // 如果清空teleport元素，则用当前元素替换占位锚点
    if (oldTeleport && !newTeleport) {
      this.dom.replace(this.element, this.anchor)
    } else if (newTeleport && !oldTeleport) {
      // 占位锚点替换当前元素
      this.dom.replace(this.anchor, this.element)
      // 当前元素插入到新的锚点中
      this.dom.appendChild(newTeleport, this.element)
    }
  }
  /**
   * 渲染元素
   *
   * 此函数每次调用都会返回一个新的元素
   *
   * @returns {HostElementInstance<T>} 渲染后的元素
   */
  protected abstract render(): HostElementInstance<T>
  /**
   * @inheritDoc
   */
  override activate(root: boolean = true): void {
    this.updateActiveState(true, root)
    this.activateChildren?.()
  }
  /**
   * @inheritDoc
   */
  override deactivate(root: boolean = true): void {
    this.deactivateChildren?.()
    this.updateActiveState(false, root)
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
    return unwrapRefProps(props) as NodeNormalizedProps<T>
  }
}
