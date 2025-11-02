import { type App, getAppContext } from '../../app/index.js'
import type {
  BindParentElement,
  HostElementInstance,
  HostParentElement,
  MountType,
  VNodeInputProps,
  WidgetType
} from '../../types/index.js'
import { NodeState } from '../constants/index.js'
import { VNode } from './VNode.js'

export abstract class WidgetNode<T extends WidgetType> extends VNode<T> {
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
  override mount(target?: HostElementInstance, type?: MountType): void {
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

  protected abstract rebuild(): VNode

  /**
   * @inheritDoc
   */
  protected override handleShowState(is: boolean): void {
    this.rootNode.show = is
  }
}
