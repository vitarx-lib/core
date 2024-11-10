import {
  Fragment,
  type HtmlTagName,
  isRefEl,
  isTextVNode,
  isVNode,
  type TextVNode,
  type VDocumentFragment,
  type VElement,
  type VNode,
  type VNodeChild,
  type VNodeChildren
} from './VNode.js'
import { isArray, isFunction, isRecordObject, isString } from '../../utils/index.js'
import {
  type ClassWidget,
  createScope,
  type HTMLClassProperties,
  type HtmlElementTags,
  type HTMLStyleProperties,
  isClassWidget,
  reactive,
  watchDepend
} from '../../index.js'
import { createFnWidget, type FnWidget } from './fn-widget.js'
import type { Widget } from './widget.js'

/**
 * 真实DOM元素
 */
export type ElementNode = Element | DocumentFragment | Text

/**
 * 小部件元素管理器
 */
export class WidgetRenderer {
  currentVNode: VNode

  constructor(protected widget: Widget) {
    const { result, listener } = watchDepend(this.build.bind(this), this.update.bind(this), {
      getResult: true
    })
    if (!isVNode(result)) {
      listener?.destroy()
      throw new Error('[Vitarx]：Widget.build方法必须返回VNode虚拟节点')
    }
    this.currentVNode = result
  }

  /**
   * 是否已挂载
   */
  get mounted(): boolean {
    return this.currentVNode.el !== null
  }

  /**
   * 获取节点对象
   *
   * @returns {VElement | null}
   */
  get el(): VElement | null {
    return this.currentVNode.el
  }

  /**
   * 获取父真实节点
   */
  get parentNode(): ParentNode | null {
    return getParentNode(this.el)
  }

  /**
   * 创建节点元素
   *
   * @returns {ElementNode}
   */
  createElement(): ElementNode {
    return createElement(this.currentVNode)
  }

  /**
   * 挂载节点
   *
   * @param parent
   */
  mount(parent?: ElementNode): ElementNode {
    let el: ElementNode
    if (this.el) {
      el = VElementToHTMLElement(this.el)
    } else {
      el = this.createElement()
      this.widget.onMounted?.()
    }
    parent?.appendChild(el)
    return el
  }

  build(): VNode {
    try {
      return this.widget.build()
    } catch (e) {
      if (this.widget?.onError && isFunction(this.widget.onError)) {
        const vnode = this.widget.onError(e)
        if (isVNode(vnode)) return vnode
      }
      // 继续向上抛出异常
      throw e
    }
  }

  update(force: boolean = false) {
    const oldVNode = this.currentVNode
    const newVNode = this.build()
    this.currentVNode = this.patchUpdate(oldVNode, newVNode)
  }

  /**
   * 差异更新
   *
   * @param oldVNode
   * @param newVNode
   */
  protected patchUpdate(oldVNode: VNode, newVNode: VNode) {
    // 类型不一致，替换原有节点
    if (oldVNode.type !== newVNode.type || oldVNode.key !== newVNode.key) {
      // 销毁旧节点作用域
      oldVNode.scope?.destroy()
      // 删除旧节点元素
      const newEl = createElement(newVNode)
      replaceChild(getParentNode(oldVNode.el)!, newEl as VElement, oldVNode.el!)
      return newVNode
    } else {
      // 非片段节点，则进行更新属性
      if (oldVNode.type !== Fragment) {
        this.patchAttrs(oldVNode, newVNode)
      }
      // 非组件节点，则进行更新子节点
      if (!isFunction(oldVNode.type)) {
        this.patchChildren(oldVNode, newVNode)
      }
      return oldVNode
    }
  }

  /**
   * 差异化更新属性
   *
   * @param oldVNode
   * @param newVNode
   */
  protected patchAttrs(oldVNode: VNode, newVNode: VNode) {
    const isWidget = isFunction(oldVNode.type),
      el = oldVNode.el as HTMLElement
    const oldAttrs = oldVNode.props as Record<string, any>
    const newAttrs = newVNode.props as Record<string, any>
    // 使用 Set 记录 oldAttrs 中的键，以便在循环中检查需要删除的属性
    const oldKeysSet = new Set(Object.keys(oldAttrs))
    // 遍历 newAttrs，检查是否有新的属性或属性值需要更新
    Object.keys(newAttrs).forEach(key => {
      // 更新或新增属性
      if (oldAttrs[key] !== newAttrs[key]) {
        if (isWidget) {
          oldAttrs[key] = newAttrs[key]
        } else {
          setAttr(el, key, newAttrs[key])
        }
      }
      // 将已经处理过的 key 从 oldKeysSet 中删除
      oldKeysSet.delete(key)
    })
    // 删除 newAttrs 中不存在的旧属性
    oldKeysSet.forEach(key => {
      if (isWidget) {
        // @ts-ignore
        delete oldAttrs[key]
      } else {
        if (key === 'className') {
          el.className = ''
        } else {
          el.removeAttribute(key)
        }
      }
    })
  }

  /**
   * 差异化更新子节点列表
   *
   * @param oldVNode
   * @param newVNode
   */
  protected patchChildren(oldVNode: VNode, newVNode: VNode): boolean {
    const oldChildren = oldVNode.children
    const newChildren = newVNode.children
    if (oldChildren === newChildren) return false
    // 如果没有旧的子节点
    if (!oldChildren && newChildren) {
      const el = VElementToHTMLElement(oldVNode.el!)
      createChildren(el, newChildren)
      // 如果是片段节点，则需要通过替换替换内容方式
      if (oldVNode.type === Fragment) {
        replaceChild(getParentNode(oldVNode.el!)!, el, oldVNode.el!)
      }
      oldVNode.children = newChildren
      return true
    }
    // 如果新子节点为空 则删除旧子节点
    if (!newChildren && oldChildren) {
      oldChildren.forEach(child => removeVNode(child))
      oldVNode.children = newChildren
      return true
    }
    const maxLength = Math.max(oldChildren!.length, newChildren!.length)
    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldChildren![i]
      const newChild = newChildren![i]
      oldChildren![i] = this.patchChild(oldVNode, oldChild, newChild)
    }
    return true
  }

  /**
   * 差异化更新子节点
   *
   * @param oldVNode
   * @param oldChild
   * @param newChild
   * @protected
   */
  protected patchChild(oldVNode: VNode, oldChild: VNodeChild, newChild: VNodeChild): VNodeChild {
    // 删除节点
    if (oldChild && !newChild) {
      removeVNode(oldChild)
      return newChild
    }
    // 新增节点
    if (!oldChild && newChild) {
      const container = VElementToHTMLElement(oldVNode.el!)
      createChild(container, newChild)
      // 如果是片段节点，则需要通过替换替换内容方式
      if (oldVNode.type === Fragment) {
        replaceChild(getParentNode(oldVNode.el!)!, container, oldVNode.el!)
      }
      return newChild
    }
    // 更新文本节点
    if (isTextVNode(oldChild) && isTextVNode(newChild)) {
      if (oldChild.value !== newChild.value) {
        oldChild.value = newChild.value
        oldChild.el!.nodeValue = newChild.value
      }
      return oldChild
    }
    // 更新节点
    if (isVNode(oldChild) && isVNode(newChild)) {
      return this.patchUpdate(oldChild, newChild)
    }
    // 替换节点
    else {
      const newEl = isTextVNode(newChild)
        ? createTextElement(newChild)
        : createElement(newChild as VNode)
      replaceChild(VElementToHTMLElement(oldVNode.el!), newEl, (oldChild as VNode).el!)
      return newChild
    }
  }
}

/**
 * 删除节点
 *
 * @protected
 * @param vnode
 */
function removeVNode(vnode: VNodeChild) {
  if (isVNode(vnode)) {
    vnode.scope?.destroy()
    if (vnode.el) removeElement(vnode.el)
  } else if (isTextVNode(vnode)) {
    if (vnode.el) vnode.el.remove()
  }
}
/**
 * 从Vnode el中获取父节点
 *
 * @param el
 */
function getParentNode(el: VElement | null): ParentNode | null {
  if (!el) return null
  return isArray(el) ? el[0].parentNode : el.parentNode
}

/**
 * 替换节点
 *
 * @param parent
 * @param newEl
 * @param oldEl
 */
function replaceChild(parent: Node, newEl: VElement | ElementNode, oldEl: VElement) {
  if (isArray(oldEl)) {
    const old = oldEl.shift()!
    removeElement(oldEl)
    parent.replaceChild(VElementToHTMLElement(newEl), old)
  } else {
    parent.replaceChild(VElementToHTMLElement(newEl), oldEl)
  }
}
/**
 * 删除元素
 *
 * @param el
 */
function removeElement(el: VElement) {
  if (isArray(el)) {
    // 删除旧节点
    el.forEach(item => item.remove())
  } else {
    el.remove()
  }
}

/**
 * 创建文本元素
 *
 * @param vnode
 */
function createTextElement(vnode: TextVNode): Text {
  const textEl = document.createTextNode(vnode.value)
  vnode.el = textEl
  return textEl
}
/**
 * 创建一个真实DOM元素
 *
 * @param vnode
 */
function createElement(vnode: VNode): ElementNode {
  let el: ElementNode
  switch (typeof vnode.type) {
    case 'string':
      // HTML 元素节点
      el = createHtmlElement(vnode as VNode<HtmlTagName>)
      break
    case 'symbol':
      // Fragment 节点
      el = createFragmentElement(vnode as VNode<Fragment>)
      break
    case 'function':
      el = createWidgetElement(vnode as VNode<ClassWidget | FnWidget>)
      break
    default:
      throw new Error(`Unsupported vnode type: ${vnode.type}`)
  }
  if (el instanceof DocumentFragment) {
    vnode.el = fragmentToNodes(el)
  } else {
    vnode.el = el
  }
  return el
}

// 创建小部件元素
function createWidgetElement(vnode: VNode<FnWidget | ClassWidget>): ElementNode {
  let component: Widget
  const scope = createScope(() => {
    vnode.props = reactive(vnode.props, false)
    // 函数组件或类组件
    component = isClassWidget(vnode.type)
      ? new vnode.type(vnode.props)
      : createFnWidget(vnode.type as FnWidget, vnode.props)
  })
  if (isRefEl(vnode.ref)) vnode.ref.value = component!
  vnode.scope = scope
  return component!.renderer.mount()
}

// 创建html元素
function createHtmlElement(vnode: VNode<HtmlElementTags>): HTMLElement {
  const el = document.createElement(vnode.type)
  setAttributes(el, vnode.props)
  createChildren(el, vnode.children)
  if (isRefEl(vnode.ref)) vnode.ref.value = el
  return el
}

// 创建 Fragment 元素
function createFragmentElement(vnode: VNode<Fragment>): DocumentFragment {
  const el = document.createDocumentFragment()
  if (!vnode.children) {
    // 创建一个空文本节点，用于占位 document.createComment('注释节点占位')
    el.appendChild(document.createTextNode(''))
    if (isRefEl(vnode.ref)) vnode.ref.value = []
  } else {
    createChildren(el, vnode.children)
    if (isRefEl(vnode.ref)) vnode.ref.value = fragmentToNodes(el)
  }
  return el
}
/**
 * 更新DOM元素的子节点
 *
 * @param parent
 * @param children
 */
function createChildren(parent: ElementNode, children: VNodeChildren | undefined): void {
  if (!children) return
  children.forEach(child => createChild(parent, child))
}

/**
 * 创建子节点
 *
 * @param parent
 * @param child
 */
function createChild(parent: ElementNode, child: VNodeChild): void {
  if (isVNode(child)) {
    parent.appendChild(createElement(child))
  } else if (isTextVNode(child)) {
    parent.appendChild(createTextElement(child))
  }
}

/**
 * 设置属性
 *
 * @param el - 目标元素
 * @param props - 属性对象
 */
function setAttributes(el: HTMLElement, props: Record<string, any>): void {
  Object.keys(props).forEach(key => {
    setAttr(el, key, props[key])
  })
}

// 设置Html元素属性
function setAttr(el: HTMLElement, key: string, value: any, oldValue?: any): void {
  switch (key) {
    case 'style':
      setStyle(el, value)
      break
    case 'class':
      setClass(el, value)
      break
    default:
      if (isHTMLNodeEvent(el, key)) {
        if (!isFunction(value)) {
          throw new TypeError(`无效的事件处理程序，${key}: ${typeof value}`)
        }
        const event = key.slice(2).toLowerCase()
        // 删除旧的事件
        if (oldValue && isFunction(oldValue)) {
          el.removeEventListener(event, oldValue)
        }
        el.addEventListener(event, value)
      } else if (key.startsWith('data-')) {
        el.dataset[key.slice(5)] = value
      } else {
        try {
          // 处理其他属性
          if (key in el) {
            // @ts-ignore
            el[key] = value
          } else {
            el.setAttribute(key, value) // 设置未知属性
          }
        } catch (error) {
          console.error(`设置属性 ${key} 时发生错误:`, error)
        }
      }
      break
  }
}

/**
 * 判断是否为事件属性
 *
 * @param el
 * @param prop
 */
function isHTMLNodeEvent(el: HTMLElement, prop: string): boolean {
  return prop.startsWith('on') && prop.toLowerCase() in el
}

/**
 * 设置内联样式
 *
 * @param el
 * @param style
 */
function setStyle(el: HTMLElement, style: HTMLStyleProperties): void {
  if (style && el.style) {
    if (isString(style)) {
      el.style.cssText = style
    } else if (isRecordObject(style)) {
      for (const key in style) {
        // @ts-ignore
        el.style[key] = style[key]
      }
    }
  }
}

/**
 * 设置样式类
 *
 * @param el
 * @param classData
 */
function setClass(el: HTMLElement, classData: HTMLClassProperties): void {
  if (classData) {
    if (isString(classData)) {
      el.className = classData
    } else if (isArray(classData)) {
      el.classList.add(...classData)
    } else if (isRecordObject(Object)) {
      for (const key in classData) {
        if (classData[key]) {
          el.classList.add(key)
        } else {
          el.classList.remove(key)
        }
      }
    }
  }
}

/**
 * node数组转换为片段
 *
 * @param nodes
 */
function nodesToFragment(nodes: VDocumentFragment): DocumentFragment {
  const el = document.createDocumentFragment()
  for (let i = 0; i < nodes.length; i++) {
    el.appendChild(nodes[i])
  }
  return el
}

/**
 * 片段转node数组
 *
 * @param el
 */
function fragmentToNodes(el: DocumentFragment): VDocumentFragment {
  const els: Node[] = []
  for (let i = 0; i < el.childNodes.length; i++) {
    els.push(el.childNodes[i])
  }
  return els as VDocumentFragment
}

/**
 * VElement 转 HTMLElement
 *
 * @param el
 * @constructor
 */
function VElementToHTMLElement(el: VElement | ElementNode): ElementNode {
  return isArray(el) ? nodesToFragment(el) : el
}
