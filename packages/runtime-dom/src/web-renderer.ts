import { unref } from '@vitarx/responsive'
import type {
  BaseRuntimeContainerElement,
  CommentVNode,
  Fragment,
  IntrinsicNodeElementName,
  RuntimeContainerElement,
  RuntimeElement,
  RuntimeFragmentElement,
  RuntimeNoTagElement,
  TextNode,
  VNode
} from '@vitarx/runtime-core'
import { createInstance, isSvgVNode, Renderer, type WidgetVNode } from '@vitarx/runtime-core'

/**
 * 浏览器渲染器
 *
 * 用于在浏览器端渲染虚拟节点
 */
export class WebRenderer extends Renderer {
  /**
   * @inheritDoc
   */
  override render(vnode: VNode, container?: BaseRuntimeContainerElement): RuntimeElement {
    let el: RuntimeElement
    if (typeof vnode.type === 'string') {
      switch (vnode.type) {
        case 'text-node':
          el = this.renderTextElement(vnode)
          break
        case 'comment-node':
          el = this.renderCommentElement(vnode)
          break
        case 'fragment-node':
          el = this.renderFragmentElement(vnode)
          break
        default:
          el = this.renderIntrinsicElement(vnode)
      }
    } else {
      el = this.renderWidgetElement(vnode)
    }
    if (container) container.appendChild(el)
    vnode.el = el
    return el
  }

  /**
   * 渲染文本元素
   *
   * @param vnode
   * @protected
   */
  protected renderTextElement(vnode: TextNode): RuntimeNoTagElement<'text-node'> {
    const el = document.createTextNode(
      unref(vnode.value)
    ) as unknown as RuntimeNoTagElement<'text-node'>
    el.tagName = 'text-node'
    return el
  }

  /**
   * 渲染注释元素
   *
   * @param vnode
   * @protected
   */
  protected renderCommentElement(vnode: CommentVNode): RuntimeNoTagElement<'comment-node'> {
    const el = document.createComment(vnode.value) as unknown as RuntimeNoTagElement<'comment-node'>
    el.tagName = 'comment-node'
    return el
  }

  /**
   * 渲染片段元素
   *
   * @param vnode
   * @protected
   */
  protected renderFragmentElement(vnode: VNode<Fragment>): RuntimeFragmentElement {
    const el = document.createDocumentFragment() as unknown as RuntimeFragmentElement
    el.tagName = 'fragment-node'
    if (vnode.children.length === 0) {
      el.shadowElement = this.renderCommentElement({ value: 'empty fragment node' } as CommentVNode)
    } else {
      this.renderChildren(el, vnode.children)
    }
    return el
  }

  /**
   * 渲染内置元素
   *
   * @param vnode
   * @protected
   */
  protected renderIntrinsicElement(vnode: VNode<IntrinsicNodeElementName>): RuntimeElement {
    const el = (
      isSvgVNode(vnode)
        ? document.createElementNS('http://www.w3.org/2000/svg', vnode.type)
        : document.createElement(vnode.type)
    ) as RuntimeElement
    // 如果元素能够设置属性，则设置属性
    if (vnode.props && el.setAttribute) {
      this.setAttributes(el as unknown as BaseRuntimeContainerElement, vnode.props)
    }
    if (vnode.children && el.children) {
      this.renderChildren(el as unknown as RuntimeContainerElement, vnode.children)
    }
    return el as unknown as RuntimeElement
  }

  /**
   * 渲染组件元素
   *
   * @param vnode
   * @protected
   */
  protected renderWidgetElement(vnode: WidgetVNode): RuntimeElement {
    createInstance(vnode).then()
    return vnode.instance!.renderer.render()
  }
}
