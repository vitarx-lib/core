import type { RefSignal } from '@vitarx/responsive'
import { unref } from '@vitarx/responsive'
import { DomHelper } from '../../dom/index'
import { VNode } from './vnode'

type Type = 'comment-node' | 'text-node'

/**
 * 纯文本节点抽象类
 */
export abstract class NoTagVNode<T extends Type> extends VNode<T> {
  #value: string

  protected constructor(type: T, value: string | RefSignal<string>) {
    super(type, null)
    this.#value = unref(value)
  }

  get value(): string {
    return this.#value
  }

  set value(value: string) {
    this.#value = value
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
    if (root) DomHelper.replace(this.element, this.shadowElement)
  }

  /**
   * @inheritDoc
   */
  override deactivate(root: boolean = true) {
    if (root) DomHelper.replace(this.shadowElement, this.element)
  }
  /**
   * @inheritDoc
   */
  override unmount() {
    if (this.element.parentNode) this.element.parentNode.removeChild(this.element)
  }

  /**
   * 无标签节点不支持任何属性
   * @protected
   */
  protected override propsHandler() {
    return
  }
}
