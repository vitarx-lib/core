import type { RefSignal } from '@vitarx/responsive'
import { unref } from '@vitarx/responsive'
import type { NoTagNodeElementName } from '../types/index.js'
import { VNode } from './vnode.js'

/**
 * 纯文本节点抽象类
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
    // 首先检查是否为VNode类型，如果不是则直接返回false
    if (!VNode.is(val)) return false
    // 检查节点类型是否为文本节点或注释节点
    return val.type === 'text-node' || val.type === 'comment-node'
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
  override mount(container?: ParentNode) {
    if (container) container.appendChild(this.element)
  }

  /**
   * @inheritDoc
   */
  override activate(root: boolean = true): void {
    if (root) this.toggleElement()
  }

  /**
   * @inheritDoc
   */
  override deactivate(root: boolean = true) {
    if (root) this.toggleElement()
  }
  /**
   * @inheritDoc
   */
  override unmount(root: boolean = true) {
    if (root && this.element.parentNode) this.element.parentNode.removeChild(this.element)
  }

  /**
   * 无标签节点不支持任何属性
   * @protected
   */
  protected override propsHandler() {
    return
  }
}
