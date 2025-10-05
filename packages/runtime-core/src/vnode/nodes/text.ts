import type { RefSignal } from '@vitarx/responsive'
import { isTextVNode } from '../guards.js'
import { NoTagVNode } from './no-tag.js'

/**
 * TextVNode 是一个用于表示文本节点的虚拟节点类，继承自 NoTagVNode。
 * 它主要用于在虚拟 DOM 中表示纯文本内容，支持静态文本和响应式文本（通过 RefSignal）。
 *
 * 核心功能：
 * - 创建和管理文本节点的虚拟表示
 * - 支持静态字符串和响应式字符串值
 * - 提供文本节点的类型检查功能
 *
 * @example
 * // 创建静态文本节点
 * const staticText = new TextVNode('Hello World');
 *
 * // 创建响应式文本节点
 * const dynamicText = new TextVSignal(ref('Dynamic Text'));
 *
 * @param value - 文本内容，可以是静态字符串或响应式字符串（RefSignal<string>）
 *
 * @extends NoTagVNode<'text-node'>
 */
export class TextVNode extends NoTagVNode<'text-node'> {
  /**
   * 运行时元素实例
   */
  #element: Text | null = null

  constructor(value: string | RefSignal<string>) {
    super('text-node', value)
  }

  /**
   * @inheritDoc
   */
  override render(): Text {
    // 如果元素尚未渲染，则先进行渲染
    if (!this.#element) {
      this.#element = document.createTextNode(this.value)
    }
    return this.#element
  }

  /**
   * 检查给定的值是否为文本节点
   *
   * @param val - 要检测的变量
   * @returns {boolean} 如果虚拟节点是文本节点则返回true，否则返回false
   */
  static override is(val: any): val is TextVNode {
    return isTextVNode(val)
  }
}
