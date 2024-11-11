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
 * 已经渲染的虚拟节点
 */
type RenderedVNode = Omit<VNode, 'el'> & { el: VElement }
/**
 * 真实DOM元素
 */
export type ElementNode = Element | DocumentFragment | Text

/**
 * 小部件渲染器
 *
 * 用于渲染小部件，和管理小部件的生命周期。
 */
export class WidgetRenderer {
  // 当前组件的Child虚拟节点
  currentChildVNode: VNode
  // 等到更新
  #pendingUpdate = false

  constructor(protected widget: Widget) {
    const { result, listener } = watchDepend(this.build.bind(this), this.update.bind(this), {
      getResult: true
    })
    if (!isVNode(result)) {
      listener?.destroy()
      throw new Error('[Vitarx]：Widget.build方法必须返回VNode虚拟节点')
    }
    this.currentChildVNode = result
  }

  /**
   * 判断是否已挂载到DOM上
   *
   * 如果组件被临时停用，也会返回false
   *
   * @returns {boolean}
   */
  get mounted(): boolean {
    return this.container !== null
  }

  /**
   * 当前小部件的child虚拟节点元素
   *
   * @returns {VElement | null}
   */
  get el(): VElement | null {
    return this.currentChildVNode.el
  }

  /**
   * 获取挂载的父元素
   *
   * @returns {ParentNode | null}
   */
  get container(): ParentNode | null {
    return getParentNode(this.el)
  }

  /**
   * 当前小部件的`child`虚拟节点
   *
   * @returns {VNode}
   */
  get child(): VNode {
    return this.currentChildVNode
  }
  /**
   * 创建节点元素
   *
   * @returns {ElementNode}
   */
  createElement(): ElementNode {
    return createElement(this.currentChildVNode)
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
      // 触发onActivated生命周期
      this.widget.onActivated?.()
      // 触发onMounted生命周期
      this.widget.onMounted?.()
    }
    // 挂载到父元素
    parent?.appendChild(el)
    return el
  }

  /**
   * 构建`child`虚拟节点
   *
   * @returns {VNode}
   */
  build(): VNode {
    let vnode: VNode
    try {
      vnode = this.widget.build() as VNode
    } catch (e) {
      if (this.widget?.onError && isFunction(this.widget.onError)) {
        vnode = this.widget.onError(e) as VNode
        if (isVNode(vnode)) return vnode
      }
      // 继续向上抛出异常
      throw e
    }
    if (isVNode(vnode)) return vnode
    throw new Error('[Vitarx]：Widget.build方法必须返回有效的VNode')
  }

  /**
   * 更新视图
   */
  update(): void {
    if (this.#pendingUpdate) return
    this.#pendingUpdate = true
    try {
      this.widget.onBeforeUpdate?.()
      setTimeout(() => {
        this.#pendingUpdate = false
      })
      const oldVNode = this.currentChildVNode
      const newVNode = this.build()
      this.currentChildVNode = this.patchUpdate(oldVNode as RenderedVNode, newVNode)
      this.widget.onUpdated?.()
    } catch (e) {
      this.#pendingUpdate = false
      console.trace(`[Vitarx]：更新视图时捕获到了异常，${e}`)
    }
  }

  /**
   * 差异更新
   *
   * @param oldVNode
   * @param newVNode
   */
  protected patchUpdate(oldVNode: RenderedVNode, newVNode: VNode): RenderedVNode {
    // 类型不一致，替换原有节点
    if (oldVNode.type !== newVNode.type || oldVNode.key !== newVNode.key) {
      // 销毁旧节点作用域
      oldVNode.scope?.destroy()
      // 删除旧节点元素
      const newEl = createElement(newVNode)
      // 从父节点上替换旧节点为新节点
      replaceChild(getParentNode(oldVNode.el), newEl as VElement, oldVNode.el)
      return newVNode as RenderedVNode
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
  protected patchAttrs(oldVNode: RenderedVNode, newVNode: VNode): void {
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
  protected patchChildren(oldVNode: RenderedVNode, newVNode: VNode): boolean {
    const oldChildren = oldVNode.children
    const newChildren = newVNode.children
    if (oldChildren === newChildren) return false
    // 如果没有旧的子节点
    if (!oldChildren && newChildren) {
      const el = VElementToHTMLElement(oldVNode.el)
      createChildren(el, newChildren)
      // 如果是片段节点，则需要将新元素替换到父节点
      if (oldVNode.type === Fragment) {
        // 如果存在父节点，在会挂载在父节点上
        replaceChild(getParentNode(oldVNode.el), el, oldVNode.el)
      }
      oldVNode.children = newChildren
      return true
    }
    // 如果新子节点为空 则删除旧子节点
    if (!newChildren && oldChildren) {
      oldChildren.forEach(child => this.destroy(child))
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
  protected patchChild(
    oldVNode: RenderedVNode,
    oldChild: VNodeChild,
    newChild: VNodeChild
  ): VNodeChild {
    // 删除节点
    if (oldChild && !newChild) {
      this.destroy(oldChild)
      return newChild
    }
    // 新增节点
    if (!oldChild && newChild) {
      const container = VElementToHTMLElement(oldVNode.el!)
      createChild(container, newChild)
      // 挂载到父节点
      if (oldVNode.type === Fragment) {
        replaceChild(getParentNode(oldVNode.el), container, oldVNode.el!)
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
      return this.patchUpdate(oldChild as RenderedVNode, newChild)
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

  /**
   * 销毁节点
   *
   * @param vnode - 要销毁的节点
   * @protected
   */
  protected destroy(vnode: VNodeChild): void {
    if (isVNode(vnode)) {
      vnode.scope?.destroy()
      removeElement(vnode.el)
    } else if (isTextVNode(vnode)) {
      if (vnode.el) vnode.el.remove()
    }
  }
}

/**
 * 获取父元素
 *
 * 等同于 `document.getElementById(id).parentNode`，只是对片段元素进行特殊处理。
 *
 * @param el
 */
export function getParentNode(el: VElement | null): ParentNode | null {
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
function replaceChild(parent: Node | null, newEl: VElement | ElementNode, oldEl: VElement) {
  if (!parent) return
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
function removeElement(el: VElement | null) {
  if (!el) return
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
  let el: ElementNode
  vnode.scope = createScope(() => {
    vnode.props = reactive(vnode.props, false)
    // 函数组件或类组件
    const component = isClassWidget(vnode.type)
      ? new vnode.type(vnode.props)
      : createFnWidget(vnode.type as FnWidget, vnode.props)
    if (isRefEl(vnode.ref)) vnode.ref.value = component!
    el = component!.renderer.mount()
  })
  return el!
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
