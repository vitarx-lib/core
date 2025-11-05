import { type App, getAppContext } from '../../app/index.js'
import type {
  BindParentElement,
  HostNodeElement,
  HostParentElement,
  MountType,
  VNodeInputProps,
  WidgetNodeType
} from '../../types/index.js'
import { getWidgetName } from '../../widget/index.js'
import { NodeState } from '../constants/index.js'
import { VNode } from './VNode.js'

/**
 * WidgetNode 是一个抽象的虚拟节点类，用于构建和管理界面组件。
 * 它继承自 VNode，提供了组件的基础功能，包括节点挂载、状态管理和 Teleport 支持。
 *
 * 核心功能：
 * - 虚拟节点的创建和管理
 * - 组件挂载和卸载
 * - 支持 Teleport 功能，允许组件渲染到 DOM 的不同位置
 * - 提供组件状态管理
 *
 * @template T - 继承自 WidgetNodeType 的类型参数
 *
 * @param type - 节点类型，用于标识具体的组件类型
 * @param props - 节点的属性配置对象
 *
 * 注意事项：
 * - 这是一个抽象类，必须通过子类实现 rebuild() 方法来使用
 * - 组件在使用前需要通过 mount() 方法进行挂载
 * - 使用 Teleport 功能时，需要注意目标元素的存在性
 */
export abstract class WidgetNode<T extends WidgetNodeType = WidgetNodeType> extends VNode<T> {
  /**
   * 组件构建的根节点
   * @protected
   */
  protected _rootNode: VNode | null = null
  /**
   * app上下文
   */
  public appContext?: App
  protected constructor(type: T, props: VNodeInputProps<T>) {
    super(type, props)
    this.appContext = getAppContext()
  }
  /**
   * 获取根节点
   * @returns {VNode} 返回虚拟根节点
   * 如果根节点尚未初始化，则通过 rebuild 方法重建
   * 使用惰性初始化策略，只在首次访问时创建根节点
   */
  get rootNode(): VNode {
    // 检查根节点是否已存在
    if (this._rootNode == null) {
      // 如果不存在，则调用 rebuild 方法重建根节点
      this._rootNode = this.rebuild()
    }
    // 返回根节点
    return this._rootNode
  }
  /**
   * @inheritDoc
   */
  override setTeleport(teleport: BindParentElement): void {
    const oldTeleport = this.teleport
    super.setTeleport(teleport)
    const newTeleport = this.teleport // 获取更新后的teleport元素
    // 如果不是活跃状态则直接返回
    if (this.state !== NodeState.Activated || oldTeleport === newTeleport) return
    const element = this.rootNode.operationTarget
    // 情况 1️⃣：从 teleport 恢复到原位置
    if (oldTeleport && !newTeleport) {
      this.dom.replace(element, this.anchor)
      return
    }
    // 情况 2️⃣：从普通位置移动到 teleport
    if (!oldTeleport && newTeleport) {
      // 占位锚点替换当前元素
      this.dom.replace(this.anchor, element)
      // 当前元素插入到新的锚点中
      this.dom.appendChild(newTeleport, element)
      return
    }
    // 情况 3️⃣：teleport 容器之间切换
    if (newTeleport && oldTeleport) {
      this.dom.appendChild(newTeleport, element)
    }
    // 情况 4️⃣：目标未变化，无需操作
  }

  /**
   * @inheritDoc
   */
  override mount(target?: HostNodeElement, type?: MountType): void {
    if (this.teleport) {
      if (target) {
        // 插入影子元素
        switch (type) {
          case 'insertBefore':
            this.dom.insertBefore(this.anchor, target)
            break
          case 'insertAfter':
            this.dom.insertAfter(this.anchor, target)
            break
          case 'replace':
            this.dom.replace(this.anchor, target)
            break
          default:
            this.dom.appendChild(target as HostParentElement, this.anchor)
        }
      }
      this.rootNode.mount(this.teleport, 'appendChild')
    } else {
      this.rootNode.mount(target, type)
    }
    this.state = NodeState.Activated
  }
  /**
   * 抽象方法，用于重建虚拟DOM节点
   * 该方法必须在子类中被实现，用于重新构建虚拟DOM树结构
   *
   * @returns {VNode} 返回重建后的虚拟DOM节点(VNode)
   */
  protected abstract rebuild(): VNode
  /**
   * 获取名称的getter方法
   *
   * @returns {string} 返回名称字符串
   */
  get name(): string {
    return getWidgetName(this.type)
  }
  /**
   * @inheritDoc
   */
  protected override handleShowState(visible: boolean): void {
    this.rootNode.show = visible
  }
}
