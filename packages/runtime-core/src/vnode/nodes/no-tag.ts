import type { RefSignal } from '@vitarx/responsive'
import { unref } from '@vitarx/responsive'
import { DomHelper } from '../../dom/index.js'
import { isNotTagVNode } from '../guards.js'
import type { MountType, NoTagNodeElementName } from '../types/index.js'
import { VNode } from './vnode.js'

/**
 * 无标签虚拟节点抽象基类，用于表示没有HTML标签的节点，如文本节点和注释节点。
 * 该类继承自VNode，提供了对无标签节点的基本操作和管理功能。
 *
 * 核心功能：
 * - 管理节点的文本值
 * - 提供节点的挂载、激活、停用和卸载功能
 * - 支持静态节点的特殊处理
 *
 * @example
 * // 创建文本节点
 * const textNode = new TextNode('hello');
 * textNode.mount(document.body);
 *
 * @param type - 节点类型，只能是'text-node'或'comment-node'
 * @param value - 节点的文本值，可以是字符串或响应式字符串引用
 *
 * 使用限制：
 * - 不支持任何属性设置
 * - 只能用于文本节点和注释节点
 */
export abstract class NoTagVNode<T extends NoTagNodeElementName> extends VNode<T> {
  #value: string

  protected constructor(type: T, value: string | RefSignal<string>) {
    super(type, null)
    this.#value = unref(value)
  }

  get value(): string {
    return this.#value
  }

  /**
   * 判断给定的值是否为NoTagVNode类型的节点
   *
   * @param val 需要判断的值
   * @returns {boolean} 如果是NoTagVNode类型返回true，否则返回false
   */
  static override is(val: any): val is NoTagVNode<any> {
    // 检查节点类型是否为文本节点或注释节点
    return isNotTagVNode(val)
  }

  /**
   * 设置值的setter方法
   * @param {string} value - 要设置的值
   */
  set value(value: string) {
    // 如果不是静态值且新值与当前值不同
    if (!this.isStatic && value !== this.#value) {
      // 更新私有属性#value
      this.#value = value
      // 更新DOM元素的节点值
      this.element.nodeValue = value
    }
  }

  /**
   * @inheritDoc
   */
  override mount(target?: Node, type?: MountType) {
    if (!target) return
    const element = this.element
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

  /**
   * @inheritDoc
   */
  override activate(root: boolean = true): void {
    if (root) this.toggleElement(true)
  }

  /**
   * @inheritDoc
   */
  override deactivate(root: boolean = true) {
    if (root) {
      this.toggleElement(false)
      this.element.remove()
    }
  }
  /**
   * @inheritDoc
   */
  override unmount(root: boolean = true) {
    if (root) {
      this.element.remove()
      this.removeShadowElement()
    }
  }

  /**
   * 无标签节点不支持任何属性
   * @protected
   */
  protected override propsHandler() {
    return
  }
}
