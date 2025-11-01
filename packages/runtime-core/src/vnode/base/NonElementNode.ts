import { useDomAdapter } from '../../host-adapter/index.js'
import type { NonElementNodeType } from '../../types/index.js'
import { HostNode } from './HostNode.js'

/**
 * 无标签虚拟节点抽象基类，用于表示没有标签的节点，如文本节点和注释节点。
 * 该类继承自VNode，提供了对无标签节点的基本操作和管理功能。
 *
 * 核心功能：
 * - 管理节点的文本值
 * - 提供节点的挂载、激活、停用和卸载功能
 * - 支持静态节点的特殊处理
 *
 * 使用限制：
 * - 不支持除value以外的任何属性设置
 * - 只能用于纯文本节点和注释节点
 */
export abstract class NonElementNode<T extends NonElementNodeType> extends HostNode<T> {
  /**
   * 获取属性值的getter方法
   * 返回this.props.value的值
   */
  get value(): string {
    return this.props.value ?? ''
  }
  /**
   * 设置值的setter方法
   * @param {string} value - 要设置的值
   */
  set value(value: string) {
    // 如果不是静态值且新值与当前值不同
    if (!this.isStatic && value !== this.value) {
      // 更新私有属性#value
      this.props.value = value
      // 更新DOM元素的节点值
      useDomAdapter().setText(this.element, value)
    }
  }
}
