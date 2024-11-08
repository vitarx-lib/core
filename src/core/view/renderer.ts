import { fragmentToNodes, type HtmlTagName, isRefEl, type VNode, type VNodeChild } from './VNode.js'
import { isArray, isFunction, isRecordObject, isString } from '../../utils/index.js'
import {
  createScope,
  type HTMLClassProperties,
  type HtmlElementTags,
  type HTMLStyleProperties,
  isClassWidget
} from '../../index.js'
import { createFnWidget, type FnWidget } from './fn-widget.js'
import type { Widget } from './widget.js'

/**
 * 真实DOM元素
 */
export type ElementNode = Element | DocumentFragment

/**
 * 创建一个真实DOM元素
 *
 * @param vnode
 * @param container
 */
export function createElement(vnode: VNode, container?: ElementNode): ElementNode {
  let el: ElementNode
  switch (typeof vnode.type) {
    case 'string':
      // HTML 元素节点
      el = createHtmlElement(vnode as VNode<HtmlTagName>)
      if (isRefEl(vnode.ref)) vnode.ref.value = el
      break
    case 'symbol':
      // Fragment 节点
      el = document.createDocumentFragment()
      updateChildren(el, vnode.children)
      if (isRefEl(vnode.ref)) vnode.ref.value = fragmentToNodes(el)
      break
    case 'function':
      let component: Widget
      const scope = createScope(() => {
        const p = {
          ...vnode.props,
          children: vnode.children
        }
        // 函数组件或类组件
        component = isClassWidget(vnode.type)
          ? new vnode.type(p)
          : createFnWidget(vnode.type as FnWidget, p)
      })
      if (isRefEl(vnode.ref)) vnode.ref.value = component!
      vnode.scope = scope
      el = component!.createElement().mount()
      break
    default:
      throw new Error(`Unsupported vnode type: ${vnode.type}`)
  }
  if (el instanceof DocumentFragment) {
    vnode.el = fragmentToNodes(el)
  } else {
    vnode.el = el
  }
  if (container) container.appendChild(el)
  return el
}
/**
 * 创建html元素
 *
 * @param vnode
 */
function createHtmlElement(vnode: VNode<HtmlElementTags>) {
  const el = document.createElement(vnode.type)
  updateAttributes(el, vnode.props)
  updateChildren(el, vnode.children)
  return el
}

/**
 * 更新DOM元素的子节点
 *
 * @param el
 * @param children
 */
function updateChildren(el: ElementNode, children?: VNodeChild) {
  if (!children) return
  if (typeof children === 'string') {
    el.appendChild(document.createTextNode(children))
  } else if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child))
      } else {
        createElement(child, el)
      }
    })
  } else {
    createElement(children, el)
  }
}

/**
 * 设置属性
 *
 * @param el - 目标元素
 * @param props - 属性对象
 * @param exclude - 排除的属性
 */
function updateAttributes(el: HTMLElement, props: Record<string, any>, exclude: string[] = []) {
  for (const key in props) {
    if (exclude.includes(key)) {
      continue
    }
    const value = props[key]
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
          el.addEventListener(key.slice(2).toLowerCase(), value)
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
}

/**
 * 判断是否为事件属性
 *
 * @param el
 * @param prop
 */
function isHTMLNodeEvent(el: HTMLElement, prop: string) {
  return prop.startsWith('on') && prop.toLowerCase() in el
}

/**
 * 设置内联样式
 *
 * @param el
 * @param style
 */
function setStyle(el: HTMLElement, style: HTMLStyleProperties) {
  if (style) {
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
function setClass(el: HTMLElement, classData: HTMLClassProperties) {
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
