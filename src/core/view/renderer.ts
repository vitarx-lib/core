import { fragmentToNodes, type HtmlVNodeType, type VNode, type VNodeChild } from './VNode.js'
import { isRef } from '../variable/index.js'
import { isArray, isConstructor, isFunction, isRecordObject, isString } from '../../utils/index.js'
import type { HTMLClassProperties, HtmlElementTags, HTMLStyleProperties } from '../../index.js'
import { createFnWidget, type FnWidget } from './fn-widget.js'

/**
 * 真实DOM元素
 */
export type ElementNode = HTMLElement | DocumentFragment

/**
 * 创建一个真实DOM元素
 *
 * @param vnode
 */
export function createElement(vnode: VNode): ElementNode {
  let el: ElementNode
  switch (typeof vnode.type) {
    case 'string':
      // HTML 元素节点
      el = createHtmlElement(vnode as VNode<HtmlVNodeType>)
      break
    case 'symbol':
      // Fragment 节点
      el = document.createDocumentFragment()
      updateChildren(el, vnode.children)
      break
    case 'function':
      // 函数组件或类组件
      const component = isConstructor(vnode.type)
        ? new vnode.type({
            ...vnode.props,
            children: vnode.children
          })
        : createFnWidget(vnode as VNode<FnWidget>)
      if (isRef(vnode.ref)) vnode.ref.value = component
      el = component.el
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
        const childEl = createElement(child)
        el.appendChild(childEl)
      }
    })
  } else {
    const childEl = createElement(children)
    el.appendChild(childEl)
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
