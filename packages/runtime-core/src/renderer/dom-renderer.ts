import { unref } from '@vitarx/responsive'
import {
  type AllNodeElementName,
  type ClassProperties,
  type CommentVNode,
  cssClassValueToString,
  cssStyleValueToString,
  type EventNames,
  type EventOptions,
  extractEventOptions,
  type Fragment,
  type FragmentElement,
  type FragmentVNode,
  type IntrinsicNodeElementName,
  isFragmentVNode,
  isSvgVNode,
  mountVNode,
  type RuntimeElement,
  type StyleProperties,
  type TextNode,
  type VNode,
  VNodeType,
  type WidgetVNode
} from '../vnode'
import { createInstance } from '../widget/index'

/**
 * DOM 渲染器类
 *
 * @description 负责将虚拟节点渲染为真实的 DOM 元素，提供完整的 DOM 操作能力
 * 包括元素创建、属性设置、事件绑定、节点插入等核心功能
 */
export class DomRenderer {
  /**
   * 渲染一个虚拟节点
   *
   * @param {VNode} vnode - 虚拟节点对象
   * @param {HTMLElement} container - 父容器元素，如果传入则会自动挂载到父容器中
   * @returns {HTMLElement} 渲染后的元素实例
   */
  static render<T extends VNodeType>(
    vnode: VNode<T>,
    container?: HTMLElement | DocumentFragment
  ): T extends AllNodeElementName ? RuntimeElement<T> : RuntimeElement {
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
    return el as any
  }
  /**
   * 渲染子节点列表
   *
   * @param {Node} parent - 父元素
   * @param {VNode[]} children - 子节点列表
   * @param {boolean} [triggerMountHook=false] - 是否触发挂载钩子
   * @returns {void}
   */
  static renderChildren(parent: Node, children: VNode[], triggerMountHook: boolean = false): void {
    for (const child of children) {
      const el = this.render(child)
      parent.appendChild(el)
      if (triggerMountHook) mountVNode(child)
    }
  }
  /**
   * 设置元素的文本内容
   *
   * @description 设置元素的文本内容
   * @param el - 元素实例
   * @param text - 文本内容
   * @returns {void}
   */
  static setText(el: RuntimeElement, text: string): void {
    el.nodeValue = unref(text)
  }
  /**
   * 设置富文本内容
   *
   * @param el - 元素实例
   * @param html - HTML 字符串
   */
  static setRichText(el: HTMLElement | SVGElement, html: string): void {
    el.innerHTML = html
  }
  /**
   * 设置元素的样式
   *
   * @description 设置元素的样式，包括设置样式属性和样式对象
   * @param el - 元素实例
   * @param style - 样式属性或样式对象
   * @returns {void}
   */
  static setStyle(el: HTMLElement | SVGElement, style: StyleProperties): void {
    const cssText = cssStyleValueToString(style)
    if (el.style.cssText !== cssText) {
      el.style.cssText = cssText
    }
    // 如果没有有效样式，移除 style 属性
    if (el.style.length === 0) el.removeAttribute('style')
  }
  /**
   * 设置元素的样式类名
   *
   * @description 设置元素的类名，包括设置类名和类名对象
   * @param el - 元素实例
   * @param classValue - 类名或类名对象
   * @returns {void}
   */
  static setClass(el: HTMLElement | SVGElement, classValue: ClassProperties): void {
    const className = cssClassValueToString(classValue)
    if (el.className !== className) {
      el.setAttribute('class', className)
    }
    if (el.classList.length === 0) el.removeAttribute('class')
  }
  /**
   * 设置元素的属性值
   *
   * @description 设置或更新元素的指定属性。如果属性已存在则更新其值，不存在则创建新属性
   * @param el - 元素实例
   * @param name - 属性名
   * @param value - 属性值
   * @returns {void}
   */
  static setAttribute(el: HTMLElement | SVGElement, name: string, value: any): void {
    value = unref(value)
    switch (name) {
      case 'style':
        this.setStyle(el, value)
        break
      case 'className':
      case 'classname':
      case 'class':
        this.setClass(el, value)
        break
      case 'v-html':
        this.setRichText(el, value)
        break
      default:
        // 如果属性以 data- 开头，则使用 dataset
        if (name.startsWith('data-')) {
          el.dataset[name.slice(5)] = value
          return
        }
        try {
          const svgNamespaceURI = 'http://www.w3.org/2000/svg'
          // 检查是否是需要使用 setAttributeNS 的属性
          if (el.namespaceURI === svgNamespaceURI) {
            if (name.startsWith('xlink:')) {
              // 对于 xlink:href 等需要使用 setAttributeNS
              el.setAttributeNS('http://www.w3.org/2000/xlink', name, String(value))
              return
            }
            if (name === 'href') {
              // SVG 中的 href 也需要使用命名空间
              el.setAttributeNS(svgNamespaceURI, 'href', String(value))
              return
            }
          }
          const isWritable = name in el
          // 尝试使用 setAttribute
          if (isWritable) {
            const descriptor = Object.getOwnPropertyDescriptor(el, name)
            // 如果该属性是可写的，直接赋值
            if (descriptor && descriptor.set) {
              ;(el as any)[name] = value
              return
            }
          }
          // 如果属性不存在，使用 setAttribute
          el.setAttribute(name, String(value))
        } catch (error) {
          console.error(
            `[Vitarx.WebRenderer][ERROR]：An error occurred when setting the attribute ${name}`,
            error,
            el
          )
        }
    }
  }
  /**
   * 为元素设置多个属性
   *
   * @param el - 元素实例
   * @param props - 属性对象
   * @returns {void}
   */
  static setAttributes(el: HTMLElement | SVGElement, props: Record<string, any>): void {
    Object.keys(props).forEach(key => {
      this.setAttribute(el, key, props[key])
    })
  }
  /**
   * 移除元素的指定属性
   *
   * @param el - 元素实例
   * @param {string} name - 要移除的属性名
   * @returns {void}
   */
  static removeAttribute(el: HTMLElement | SVGElement, name: string): void {
    if (name === 'className' || name === 'classname' || name === 'class') {
      el.removeAttribute('class')
    } else {
      el.removeAttribute(name)
    }
  }
  /**
   * 获取元素的属性值
   *
   * @description 获取元素指定属性的值
   * @param el - 元素实例
   * @param name - 属性名
   * @returns {any} 属性值，如果属性不存在则返回null
   */
  static getAttribute(el: HTMLElement | SVGElement, name: string): any {
    return el.getAttribute(name)
  }
  /**
   * 为元素添加事件监听器
   *
   * @param el
   * @param {string} name - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {object} [options] - 事件监听器的配置选项
   * @property {boolean} [options.capture=false] - 是否在捕获阶段触发事件监听器
   * @property {boolean} [options.once=false] - 是否只触发一次事件监听器
   * @property {boolean} [options.passive=false] - 是否使用passive模式注册事件监听器
   * @returns {void}
   * @description 为元素添加指定类型的事件监听器
   * @example
   * // 添加点击事件监听器
   * element.addEventListener("click", (e) => console.log("clicked"), { capture: true });
   */
  static addEventListener(
    el: HTMLElement | SVGElement,
    name: EventNames,
    handler: (...args: any[]) => any,
    options?: EventOptions
  ): void {
    const { event, options: eventOptions } = extractEventOptions(name)
    Object.assign(eventOptions, options)
    el.addEventListener(event, handler as any, eventOptions)
  }
  /**
   * 移除元素的事件监听器
   *
   * @param el
   * @param {string} name - 事件名称
   * @param {Function} handler - 要移除的事件处理函数
   * @param {boolean} useCapture - 是否使用捕获阶段移除事件监听器
   * @returns {void}
   * @description 移除元素上指定的事件监听器
   * @example
   * // 移除点击事件监听器
   * element.removeEventListener("click", clickHandler);
   */
  static removeEventListener(
    el: HTMLElement | SVGElement,
    name: EventNames,
    handler: (...args: any[]) => any,
    useCapture: boolean = false
  ): void {
    const { event, options } = extractEventOptions(name)
    useCapture = options.capture ?? useCapture
    el.removeEventListener(event, handler as any, useCapture)
  }
  /**
   * 在指定的锚点节点之前插入新的子元素
   *
   * @description 在当前元素的指定子元素之前插入新元素。如果锚点节点不是当前元素的子元素，则此操作无效
   * @param child - 要插入的子元素
   * @param anchor - 锚点节点
   * @returns {void}
   */
  static insertBefore(child: RuntimeElement, anchor: RuntimeElement): void {
    child.parentElement?.insertBefore(child, anchor)
  }
  /**
   * 在指定的锚点节点之后插入新的子元素
   *
   * @description 在当前元素的指定子元素之前插入新元素。如果锚点节点不是当前元素的子元素，则此操作无效
   * @param child - 要插入的子元素
   * @param anchor - 锚点节点
   * @returns {void}
   */
  static insertAfter(child: RuntimeElement, anchor: RuntimeElement): void {
    const parent = anchor.parentElement
    if (!parent) return
    const next = anchor.nextSibling
    if (next) {
      parent.insertBefore(child, next)
    } else {
      parent.appendChild(child)
    }
  }
  /**
   * 获取虚拟节点的父级真实DOM元素
   *
   * @param vnode - 虚拟节点对象
   * @returns {RuntimeElement | null} 返回父级真实DOM元素，如果不存在则返回null
   */
  static getParentElement(vnode: VNode): RuntimeElement | null {
    const el = this.getFirstChildElement(vnode)
    return el?.parentElement ?? null
  }
  /**
   * 获取虚拟节点对应的真实DOM元素的第一个子元素
   * 如果元素不具有 children 则返回当前元素本身
   *
   * @param vnode - 虚拟节点对象
   * @returns 返回第一个子元素，如果不存在则返回null
   */
  static getFirstChildElement(vnode: VNode): RuntimeElement | null {
    // 检查虚拟节点是否有关联的真实DOM元素
    if (!vnode.el) return null
    let el = vnode.el
    // 检查元素是否具有children属性
    if (!('children' in el)) return el
    // 处理DocumentFragment类型的情况
    if (el instanceof DocumentFragment) {
      const fragmentVNode = vnode as FragmentVNode

      // 如果fragment没有子节点，返回shadow元素（需确保存在）
      if (fragmentVNode.children.length === 0) {
        return el.$shadowElement ?? null
      } else {
        // 获取第一个子虚拟节点并递归处理
        const firstChildVNode = fragmentVNode.children[0]
        if (!firstChildVNode.el) return null
        el = firstChildVNode.el

        // 如果第一个子节点仍然是DocumentFragment，递归调用
        if (el instanceof DocumentFragment) {
          return this.getFirstChildElement(firstChildVNode)
        }
      }
    }

    // 返回第一个子元素，确保firstChild存在
    return el.firstChild ? (el.firstChild as RuntimeElement) : null
  }
  /**
   * 获取虚拟节点对应的真实DOM元素的最后一个子元素
   * @param vnode - 虚拟节点对象
   * @returns 返回最后一个子元素，如果不存在则返回null
   */
  static getLastChildElement(vnode: VNode): RuntimeElement | null {
    // 检查虚拟节点是否有关联的真实DOM元素
    if (!vnode.el) return null
    let el = vnode.el

    // 检查元素是否具有children属性
    if (!('children' in el)) return null

    // 处理DocumentFragment类型的情况
    if (el instanceof DocumentFragment) {
      const fragmentVNode = vnode as FragmentVNode

      // 如果fragment没有子节点，返回shadow元素（需确保存在）
      if (fragmentVNode.children.length === 0) {
        return el.$shadowElement ?? null
      } else {
        // 获取最后一个子虚拟节点并递归处理
        const lastChildrenVNode = fragmentVNode.children[fragmentVNode.children.length - 1]
        if (!lastChildrenVNode.el) return null
        el = lastChildrenVNode.el

        // 如果最后一个子节点仍然是DocumentFragment，递归调用
        if (el instanceof DocumentFragment) {
          return this.getLastChildElement(lastChildrenVNode)
        }
      }
    }

    // 返回最后一个子元素，确保lastChild存在
    return el.lastChild ? (el.lastChild as RuntimeElement) : null
  }
  /**
   * 将虚拟节点挂载到指定容器中
   *
   * @param container - 挂载容器，可以是HTMLElement、SVGElement或FragmentElement
   * @param vnode - 虚拟节点
   * @returns 无返回值
   */
  static mount(container: HTMLElement | SVGElement | FragmentElement, vnode: VNode): void {
    let el: RuntimeElement = vnode.el!
    if (isFragmentVNode(vnode)) {
      el = this.recoveryFragmentChildNodes(vnode)
    }
    container.appendChild(el)
  }
  /**
   * 从DOM中移除虚拟节点对应的真实元素
   * @param vnode - 需要移除的虚拟节点
   * @returns 无返回值
   */
  static remove(vnode: VNode): void {
    if (!vnode.el) return
    const el = vnode.el
    if (!(el instanceof DocumentFragment)) {
      return el.remove()
    }
    const children = (vnode as FragmentVNode).children
    if (children?.length) {
      children.forEach(this.remove)
    } else {
      el.$shadowElement?.remove()
    }
  }
  /**
   * 恢复片段节点的子节点
   *
   * @param vnode - 片段虚拟节点
   * @returns 返回恢复后的片段元素
   */
  static recoveryFragmentChildNodes(vnode: FragmentVNode): FragmentElement {
    const el = vnode.el as FragmentElement
    if (el.childNodes.length === 0) {
      if (vnode.children?.length) {
        // 递归恢复片段节点
        for (let i = 0; i < vnode.children.length; i++) {
          const childVNode = vnode.children[i]
          let childEl = childVNode.el
          if (isFragmentVNode(childVNode)) {
            childEl = this.recoveryFragmentChildNodes(childVNode)
          }
          el.appendChild(childEl!)
        }
      } else {
        // 恢复空节点
        el.appendChild(el.$shadowElement!)
      }
    }
    return el
  }
  /**
   * 渲染文本元素
   *
   * @param vnode
   * @protected
   */
  protected static renderTextElement(vnode: TextNode): Text {
    return document.createTextNode(unref(vnode.value))
  }
  /**
   * 渲染注释元素
   *
   * @param vnode
   * @protected
   */
  protected static renderCommentElement(vnode: CommentVNode): Comment {
    return document.createComment(unref(vnode.value))
  }
  /**
   * 渲染片段元素
   *
   * @param vnode
   * @protected
   */
  protected static renderFragmentElement(vnode: VNode<Fragment>): FragmentElement {
    const el = document.createDocumentFragment() as FragmentElement
    if (vnode.children.length === 0) {
      el.$shadowElement = this.renderCommentElement({
        value: 'empty fragment node'
      } as CommentVNode)
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
  protected static renderIntrinsicElement(
    vnode: VNode<IntrinsicNodeElementName>
  ): HTMLElement | SVGElement {
    const el = isSvgVNode(vnode)
      ? document.createElementNS('http://www.w3.org/2000/svg', vnode.type)
      : document.createElement(vnode.type)
    // 如果元素能够设置属性，则设置属性
    if (vnode.props) {
      this.setAttributes(el, vnode.props)
    }
    if (vnode.children && el.children) {
      this.renderChildren(el, vnode.children)
    }
    return el
  }
  /**
   * 渲染组件元素
   *
   * @param vnode
   * @protected
   */
  protected static renderWidgetElement(vnode: WidgetVNode): RuntimeElement {
    createInstance(vnode).then()
    return vnode.instance!.renderer.render()
  }
}
