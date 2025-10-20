import { markRaw } from '@vitarx/responsive'
import { DomHelper } from '../../dom/index.js'
import { isFragmentVNode } from '../guards.js'
import { FRAGMENT_NODE_TYPE } from '../node-symbol.js'
import type { Child, FragmentElement, FragmentNodeElementName } from '../types/index.js'
import { ContainerVNode } from './container.js'

/**
 * 片段节点类，继承自ContainerVNode
 *
 * @extends ContainerVNode<FragmentNodeElementName>
 */
export class FragmentVNode extends ContainerVNode<FragmentNodeElementName> {
  constructor(props: { children: Child[] } | null = null) {
    super(FRAGMENT_NODE_TYPE, props)
  }
  /**
   * @inheritDoc
   */
  protected override showHandler(show: boolean): void {
    for (const child of this.children) {
      child.isShow = show
    }
  }
  /**
   * @inheritDoc
   */
  override render(): FragmentElement {
    const element = markRaw(document.createDocumentFragment() as FragmentElement)
    const node = this
    // 设置虚拟节点属性
    Object.defineProperties(element, {
      $startAnchor: {
        value: document.createComment('start fragment tag element')
      },
      $endAnchor: {
        value: document.createComment('end fragment tag element')
      },
      $children: {
        get value() {
          return node.children
        }
      }
    })
    element.appendChild(element.$startAnchor)
    this.renderChildren(element)
    element.appendChild(element.$endAnchor)
    return element
  }
  /**
   * 判断给定的值是否为片段节点(FragmentVNode)
   *
   * @param val - 要检测的变量
   * @returns {boolean} 如果是片段节点则返回true，否则返回false
   */
  static override is(val: any): val is FragmentVNode {
    return isFragmentVNode(val)
  }
  /**
   * 受保护的方法重写，用于处理属性
   * 该方法是一个重写方法，用于处理组件的属性逻辑
   * 片段节点没有属性，目前方法体为空，仅有一个return语句
   */
  protected override propsHandler() {
    return // 直接返回，不执行任何操作
  }

  /**
   * @inheritDoc
   */
  override unmount(root: boolean = true): void {
    for (const child of this.children) {
      child.unmount(root)
    }
    if (root) {
      this.removeShadowElement()
      DomHelper.remove(this.element)
    }
    this._cachedElement = null
  }
}
