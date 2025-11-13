import { unref } from '@vitarx/responsive'
import { NodeState } from '../../constants/index.js'
import type {
  BindParentElement,
  HostNodeElements,
  HostNodeNames,
  HostParentElement,
  MountType,
  NodeElementType,
  NodeNormalizedProps
} from '../../types/index.js'
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
export abstract class HostNode<T extends HostNodeNames = HostNodeNames> extends VNode<T> {
  /**
   * 缓存的元素
   *
   * @protected
   */
  protected cachedElement: NodeElementType<T> | null = null
  /**
   * 获取对象的名称属性
   * 这是一个getter方法，用于返回对象的type属性值
   * @returns {string} 返回type属性值
   */
  get name(): T {
    return this.type
  }
  /**
   * 重写渲染方法，用于创建或获取缓存的DOM元素
   * @returns {NodeElementType<T>} 返回渲染后的DOM元素
   */
  override render(): NodeElementType<T> {
    // 如果已经存在缓存的元素，则直接返回
    if (this.cachedElement) return this.cachedElement
    // 如果没有缓存的元素，则创建新的元素
    this.cachedElement = this.createElement()
    // 渲染子节点
    this.renderChildren?.()
    // 更新节点状态为已渲染
    this.state = NodeState.Rendered
    // 返回创建或缓存的元素
    return this.cachedElement
  }
  /**
   * @inheritDoc
   */
  override unmount(): void {
    this.unmountChildren?.()
    this.dom.remove(this.element)
    this.cachedElement = null
    this.state = NodeState.Unmounted
  }
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
   * @inheritDoc
   */
  override mount(target?: HostNodeElements, type?: MountType): void {
    const teleport = this.teleport
    const dom = this.dom
    let element: NodeElementType = this.element
    if (teleport) {
      // 挂载真实元素到 teleport 目标
      dom.appendChild(teleport, this.element)
      // 在原文档位置保留 anchor 作为占位
      element = this.anchor
    }
    // 挂载到指定目标
    if (target) {
      switch (type) {
        case 'insertBefore':
          dom.insertBefore(element, target)
          break
        case 'replace':
          dom.replace(element, target)
          break
        default:
          if (dom.getParentElement(element) !== target) {
            dom.appendChild(target as HostParentElement, element)
          }
      }
    }
    this.mountChildren?.()
    this.state = NodeState.Activated
  }

  /**
   * 创建运行时元素实例
   *
   * 子类需要实现此方法，用于创建运行时元素实例
   *
   * @protected
   */
  protected abstract createElement(): NodeElementType<T>
  /**
   * @inheritDoc
   */
  override setTeleport(teleport: BindParentElement): void {
    const oldTeleport = this.teleport
    super.setTeleport(teleport)
    const newTeleport = this.teleport // 获取更新后的teleport元素
    // 如果不是活跃状态则直接返回
    if (this.state !== NodeState.Activated || oldTeleport === newTeleport) return
    // 情况 1️⃣：从 teleport 恢复到原位置
    if (oldTeleport && !newTeleport) {
      this.dom.replace(this.element, this.anchor)
      return
    }
    // 情况 2️⃣：从普通位置移动到 teleport
    if (!oldTeleport && newTeleport) {
      // 占位锚点替换当前元素
      this.dom.replace(this.anchor, this.element)
      // 当前元素插入到新的锚点中
      this.dom.appendChild(newTeleport, this.element)
      return
    }
    // 情况 3️⃣：teleport 容器之间切换
    if (newTeleport && oldTeleport) {
      this.dom.appendChild(newTeleport, this.element)
    }
    // 情况 4️⃣：目标未变化，无需操作
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
   * 渲染子节点
   *
   * 此方法是可选的，如果元素不支持子节点，则不需要实现此方法。
   *
   * @protected
   */
  protected renderChildren?(): void
  /**
   * 规范化节点属性的受保护重写方法
   * @param props - 需要规范化的属性对象，键为字符串，值为任意类型
   * @returns {NodeNormalizedProps<T>} 返回规范化的有效节点属性对象
   */
  protected override initProps(props: Record<string, any>): NodeNormalizedProps<T> {
    // 解包ref
    for (const prop in props) {
      props[prop] = unref(props[prop])
    }
    return props as NodeNormalizedProps<T>
  }
}
