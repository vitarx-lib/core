import { type Child, type FragmentElement } from '../types'
import { CommentVNode } from './comment'
import { ContainerVNode } from './container'

export class FragmentVNode extends ContainerVNode<'fragment-node'> {
  /**
   * 运行时元素实例
   */
  #element: FragmentElement | null = null

  constructor(props: { children: Child[] } | null = null, children: Child[] | null = null) {
    super('fragment-node', props, children)
    // 如果没有子节点，则创建一个默认的注释节点元素
    if (this.children.length === 0) {
      this.children.push(new CommentVNode('empty fragment shadow element'))
    }
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
      // 设置虚拟节点属性
      Object.defineProperty(this.#element, '$vnode', {
        value: this
      })
      // 渲染子节点
      this.renderChildren()
    }
    return this.#element
  }
  /**
   * 判断给定的虚拟节点是否为片段节点(FragmentVNode)
   *
   * @param val - 要检测的变量
   * @returns {boolean} 如果是片段节点则返回true，否则返回false
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
