import { type Child, type FragmentElement } from '../types'
import { ContainerVNode } from './container'

export class FragmentVNode extends ContainerVNode<'fragment-node'> {
  /**
   * 运行时元素实例
   */
  #element: FragmentElement | null = null
  #shadowElement: Comment | null = null

  constructor(props: { children: Child[] } | null = null, children: Child[] | null = null) {
    super('fragment-node', props, children)
  }

  /**
   * 获取 shadow 元素的访问器属性
   * 如果 shadow 元素不存在，则创建一个空的注释节点作为占位符
   * @returns {Comment} 返回 shadow 元素，可能是已存在的或新创建的注释节点
   */
  get shadowElement(): Comment {
    if (!this.#shadowElement) {
      // 检查 shadowElement 是否已初始化
      this.#shadowElement = document.createComment('empty fragment node') // 如果未初始化，创建一个注释节点作为占位符
    }
    return this.#shadowElement // 返回 shadow 元素
  }

  /**
   * 获取元素的运行时实例
   * 这是一个重写的方法，用于获取或创建片段元素的实例
   *
   * @return {FragmentElement} 返回片段元素，这是一个文档片段对象，包含了虚拟DOM的节点信息
   */
  override get element(): FragmentElement {
    // 如果元素尚未渲染，则先进行渲染
    if (!this.#element) {
      this.#element = document.createDocumentFragment() as FragmentElement
      Object.defineProperty(this.#element, '$vnode', {
        value: this
      })
      if (this.children.length === 0) {
        this.#element.appendChild(this.shadowElement)
      } else {
        this.renderChildren()
      }
    }
    return this.#element
  }
  /**
   * 判断给定的虚拟节点是否为片段节点(FragmentVNode)
   *
   * @param val - 要检测的变量
   * @returns {boolean} 如果虚拟节点是文本节点则返回true，否则返回false
   */
  static override is(val: any): val is FragmentVNode {
    if (!super.is(val)) return false
    return val.type === 'fragment-node' // 通过检查节点的类型是否为text-node来判断
  }
  /**
   * 受保护的方法重写，用于处理属性
   * 该方法是一个重写方法，用于处理组件的属性逻辑
   * 片段节点没有属性，目前方法体为空，仅有一个return语句
   */
  protected override propsHandler() {
    return // 直接返回，不执行任何操作
  }
}
