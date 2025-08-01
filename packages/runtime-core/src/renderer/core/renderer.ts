import type { VNode, VNodeType } from '../../vnode/index'
import type { WidgetType } from '../../widget/index'
import type {
  ClassProperties,
  EventNames,
  EventOptions,
  RuntimeElements,
  StyleProperties
} from '../types/index'
import {
  cssClassValueToString,
  cssStyleValueToString,
  extractEventOptions,
  formatPropValue
} from './utils'

/**
 * 渲染器抽象基类
 *
 * @remarks
 * 渲染器是一个抽象基类，它提供了一些通用的渲染操作，如创建绑定事件，删除事件等基本操作。
 * 渲染器必须继承此类，并实现抽象方法，以实现实际的渲染操作。
 *
 * @example
 * ```typescript
 * class WebRenderer extends Renderer {
 *   render(vnode: VNode): RuntimeElements {
 *     // 实现实际的渲染操作
 *   }
 *   setText(el: RuntimeElements, text: string): void {
 *     // 实现实际的文本设置操作
 *   }
 *   setStyle(el: RuntimeElements, style: StyleProperties): void {
 *     // 实现实际的样式设置操作
 *   }
 *   setClass(el: RuntimeElements, className: string[]): void {
 *     // 实现实际的类设置操作
 *   }
 *   setAttribute(el: RuntimeElements, name: string, value: any): void {
 *     // 实现实际的属性设置操作
 *   }
 *   removeAttribute(el: RuntimeElements, name: string): void {
 *     // 实现实际的属性移除操作
 *   }
 * }
 *
 * @abstract
 */
export abstract class Renderer {
  /**
   * 渲染虚拟节点
   *
   * @description 根据虚拟节点创建对应的真实DOM节点
   * @param vnode - 虚拟节点
   * @returns {RuntimeElements}
   */
  abstract render(vnode: VNode<Exclude<VNodeType, WidgetType>>): RuntimeElements

  /**
   * 设置元素的文本内容
   *
   * @description 设置元素的文本内容，如果非文本/注释节点则
   * @param el - 元素实例
   * @param text - 文本内容
   * @returns {void}
   */
  setText(el: RuntimeElements, text: string): void {
    el.nodeValue = formatPropValue(text)
  }

  /**
   * 设置富文本内容
   *
   * @param el - 元素实例
   * @param html - HTML 字符串
   */
  setRichText(el: RuntimeElements, html: string): void {
    'innerHTML' in el && (el.innerHTML = formatPropValue(html))
  }

  /**
   * 设置元素的样式
   *
   * @description 设置元素的样式，包括设置样式属性和样式对象
   * @param el - 元素实例
   * @param style - 样式属性或样式对象
   * @returns {void}
   */
  setStyle(el: RuntimeElements, style: StyleProperties): void {
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
  setClass(el: RuntimeElements, classValue: ClassProperties): void {
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
  abstract setAttribute(el: RuntimeElements, name: string, value: any): void

  /**
   * 移除元素的指定属性
   *
   * @param el - 元素实例
   * @param {string} name - 要移除的属性名
   * @returns {void}
   */
  removeAttribute(el: RuntimeElements, name: string): void {
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
  getAttribute(el: RuntimeElements, name: string): any {
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
  addEventListener(
    el: RuntimeElements,
    name: EventNames,
    handler: Function,
    options?: EventOptions
  ): void {
    const { event, options: eventOptions } = extractEventOptions(name)
    Object.assign(eventOptions, options)
    el.addEventListener(event, handler, eventOptions)
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
  removeEventListener(
    el: RuntimeElements,
    name: EventNames,
    handler: Function,
    useCapture: boolean = false
  ): void {
    const { event, options } = extractEventOptions(name)
    useCapture = options.capture ?? useCapture
    el.removeEventListener(event, handler, useCapture)
  }

  /**
   * 在指定的锚点节点之前插入新的子元素
   *
   * @description 在当前元素的指定子元素之前插入新元素。如果锚点节点不是当前元素的子元素，则此操作无效
   * @param child - 要插入的子元素
   * @param anchor - 锚点节点
   * @returns {void}
   */
  insertBefore(child: RuntimeElements, anchor: RuntimeElements): void {
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
  insertAfter(child: RuntimeElements, anchor: RuntimeElements): void {
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
   * 使用新元素替换现有的子元素
   *
   * @description 用新元素替换当前元素中的现有子元素。如果要替换的节点不是当前元素的子元素，则此操作无效
   * @param newChild - 用于替换的新元素
   * @param oldChild - 要被替换的现有子元素
   * @returns {void}
   */
  replaceChild(newChild: RuntimeElements, oldChild: RuntimeElements): void {
    oldChild.parentElement?.replaceChild(newChild, oldChild)
  }

  /**
   * 在当前元素的末尾添加一个子元素
   *
   * @description 将指定的节点添加为容器的最后一个子元素
   * @param container
   * @param child - 要添加的子元素
   * @returns {void}
   */
  appendChild(container: RuntimeElements, child: RuntimeElements): void {
    container.appendChild(child)
  }

  /**
   * 移除指定的子元素
   *
   * @description 从容器元素中移除指定的子元素。如果要移除的节点不是当前元素的子元素，则此操作无效
   * @param container - 当前元素的容器节点
   * @param child - 要移除的子元素
   * @returns {void}
   */
  removeChild(container: RuntimeElements, child: RuntimeElements): void {
    container.removeChild(child)
  }
}
