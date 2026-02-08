import {
  type ClassProperties,
  type FragmentView,
  type HostComment,
  type HostContainer,
  type HostElement,
  type HostElementTag,
  type HostFragment,
  type HostNode,
  type HostText,
  isFragmentView,
  ListView,
  type StyleProperties,
  StyleUtils,
  type ViewRenderer
} from '@vitarx/runtime-core'
import { logger } from '@vitarx/utils'
import type { HTMLEventOptions } from '../types/index.js'

const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink'
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const DEFAULT_PROPERTIES_CACHE = new Map<string, Record<string, any>>()
/**
 * DOMRenderer渲染器，实现了ViewRenderer接口，用于在浏览器环境中进行DOM操作和渲染。
 *
 * 主要功能：
 * - 创建和管理DOM元素、文本节点、注释节点和文档片段
 * - 处理DOM节点的插入、删除、替换和属性操作
 * - 管理CSS类和样式
 * - 处理事件监听器的添加和移除
 *
 * 特殊说明：
 * - 该类专门用于浏览器环境，依赖于浏览器的DOM API
 * - 在处理Fragment节点时会特殊处理，确保正确维护其子节点
 * - 支持SVG元素的创建和操作
 * - 提供了完善的错误处理机制
 * - 此类实例注册在运行时核心中，用于处理浏览器环境下的DOM操作和渲染。
 */
export class DOMRenderer implements ViewRenderer {
  /** @inheritDoc */
  isSVGElement(node: HostNode): boolean {
    // 检查节点是否存在
    if (!node) return false
    // 处理 Fragment 节点
    if (this.isFragment(node)) {
      // 检查 startAnchor 和其父元素是否存在
      const parentElement = node.$startAnchor?.parentElement
      if (!parentElement) return false
      node = parentElement
    }
    // 处理普通元素节点
    if (this.isElement(node)) {
      return node.namespaceURI === SVG_NAMESPACE && node.tagName.toLowerCase() !== 'foreignobject'
    }
    // 其他类型节点（文本节点、注释节点等）不是 SVG 元素
    return false
  }
  /** @inheritDoc */
  createComment(text: string): HostComment {
    return document.createComment(text)
  }
  /** @inheritDoc */
  createElement<T extends HostElementTag>(tag: T, useSVGNamespace: boolean): HostElement<T> {
    let el: Element
    if (useSVGNamespace) {
      el = document.createElementNS('http://www.w3.org/2000/svg', tag)
    } else {
      el = document.createElement(tag)
    }
    return el as HostElement<T>
  }
  /** @inheritDoc */
  createFragment(view: FragmentView | ListView): HostFragment {
    const el = document.createDocumentFragment() as HostFragment
    const type = isFragmentView(view) ? 'FragmentView' : 'ListView'
    el.$startAnchor = document.createComment(`${type}:start`)
    el.$endAnchor = document.createComment(`${type}:end`)
    el.$view = view
    return el
  }
  /** @inheritDoc */
  createText(text: string): HostText {
    return document.createTextNode(text)
  }
  /** @inheritDoc */
  append(child: HostNode, parent: HostContainer): void {
    child = this.recoveryFragmentChildren(child)
    // 如果是插入到片段节点中，则判断是否已挂载
    if (this.isFragment(parent) && parent.$endAnchor.parentNode) {
      const endAnchor = parent.$endAnchor
      endAnchor.parentNode!.insertBefore(child, endAnchor)
    } else {
      parent.appendChild(child)
    }
  }

  /** @inheritDoc */
  insert(child: HostNode, anchor: HostNode): void {
    // 如果锚点元素是Fragment，则插入到结束锚点之后
    if (this.isFragment(anchor)) {
      anchor = anchor.$startAnchor
    }
    // 获取锚点元素的父级元素
    const parent = anchor.parentNode
    if (!parent) {
      if (__DEV__) {
        logger.warn(
          'DOMRenderer.insert(): The anchor node does not have a parent node',
          child,
          anchor
        )
      }
      return
    }
    child = this.recoveryFragmentChildren(child)
    parent.insertBefore(child, anchor)
  }
  /** @inheritDoc */
  isElement(node: HostNode): node is HostElement {
    return node.nodeType === Node.ELEMENT_NODE
  }
  /** @inheritDoc */
  remove(node: HostNode): void {
    if (!this.isFragment(node)) return node.remove()
    const { $startAnchor: start, $endAnchor: end } = node
    const range = document.createRange()
    range.setStartBefore(start)
    range.setEndAfter(end)
    range.deleteContents()
  }
  /** @inheritDoc */
  replace(newNode: HostNode, oldNode: HostNode): void {
    const isFragment = this.isFragment(oldNode)
    // 获取父节点，片段元素使用 startAnchor 的父节点
    const parent = isFragment ? oldNode.$startAnchor.parentNode : oldNode.parentNode
    if (!parent) {
      if (__DEV__) {
        logger.warn(
          '[DOMRenderer.replace]: The old node does not have a parent node',
          newNode,
          oldNode
        )
      }
      return
    }
    newNode = this.recoveryFragmentChildren(newNode)
    // 片段元素需要在 startAnchor 之前插入，然后删除旧元素
    if (isFragment) {
      parent.insertBefore(newNode, oldNode.$startAnchor)
      this.remove(oldNode)
    } else {
      parent.replaceChild(newNode, oldNode)
    }
  }
  /** @inheritDoc */
  setAttribute(el: HostElement, name: string, nextValue: any, prevValue: any): void {
    if (name === 'children') return
    try {
      if (nextValue == null) {
        this.removeAttribute(el, name, prevValue)
        return
      }
      // 处理事件属性
      if (typeof nextValue === 'function') {
        if (prevValue === nextValue) return
        // 清除旧事件
        if (typeof prevValue === 'function') {
          this.removeEventListener(el, name, prevValue)
        }
        // 绑定新事件
        this.addEventListener(el, name, nextValue)
        return
      }
      // 处理 data 属性
      if (name.startsWith('data-')) {
        el.dataset[name.slice(5)] = nextValue
        return
      }
      // 处理 xlink 属性
      if (name.startsWith('xlink:')) {
        el.setAttributeNS(XLINK_NAMESPACE, name, String(nextValue))
        return
      }
      switch (name) {
        case 'style':
          this.setStyle(el, nextValue)
          return
        case 'class':
        case 'className':
        case 'classname':
          this.setClass(el, nextValue)
          return
        case 'v-html':
          el.innerHTML = nextValue
          return
        case 'autoFocus':
          el.autofocus = Boolean(nextValue)
          return
        case 'xmlns:xlink':
          el.setAttributeNS(XMLNS_NAMESPACE, name, String(nextValue))
          return
      }
      // 尝试直接设置属性
      if (this.trySetDirectProperty(el, name, nextValue)) {
        return
      }
      // 使用 setAttribute 作为后备方案
      el.setAttribute(name, String(nextValue))
    } catch (error) {
      console.error(
        `[DOMRenderer.setAttribute][ERROR]：an error occurred when setting the attribute ${name}`,
        error,
        el
      )
    }
  }
  /** @inheritDoc */
  setText(node: HostNode, text: string): void {
    node.textContent = text
  }
  /** @inheritDoc */
  isFragment(el: HostNode | HostContainer): el is HostFragment {
    return el.nodeType === Node.DOCUMENT_FRAGMENT_NODE
  }
  private setClass(el: HostElement, classValue: ClassProperties): void {
    const className = StyleUtils.cssClassValueToString(classValue)
    if (el.className !== className) {
      el.setAttribute('class', className)
    }
    if (el.classList.length === 0) el.removeAttribute('class')
  }
  private setStyle(el: HostElement, style: StyleProperties): void {
    const cssText = StyleUtils.cssStyleValueToString(style)
    if (el.style.cssText !== cssText) {
      el.style.cssText = cssText
    }
    // 如果没有有效样式，移除 style 属性
    if (el.style.length === 0) el.removeAttribute('style')
  }
  private removeAttribute(el: HostElement, key: string, prevValue?: any): void {
    // 特殊处理 v-html属性
    if (key === 'v-html' || key === 'innerHTML') {
      el.innerHTML = ''
      return
    }
    // --- 1. class 特殊处理 ---
    if (key === 'class' || key === 'className' || key === 'classname') {
      el.removeAttribute('class')
      return
    }
    if (key === 'style') {
      el.removeAttribute('style')
    }
    // --- 2. 事件属性 ---
    if (typeof prevValue === 'function' && key.startsWith('on')) {
      this.removeEventListener(el, key, prevValue)
      return
    }
    // 判断是否是有效的 JS property
    if (key in el) {
      try {
        // --- 3. 还原属性到默认值 ---
        const tag = el.tagName.toLowerCase()
        const defaultValue = this.getDefaultValue(tag, key)
        if (defaultValue !== undefined) {
          ;(el as any as Record<string, any>)[key] = defaultValue
        }
      } catch {
        // 一些只读属性（如 innerHTML）会抛异常，退回到 removeAttribute
        el.removeAttribute(key)
      }
    } else {
      // --- 4. 普通 attribute ---
      el.removeAttribute(key)
    }
  }

  /**
   * 尝试直接设置属性
   * @param el - 要设置属性的元素对象
   * @param name - 属性名称
   * @param value - 属性值
   * @returns {boolean} 如果成功设置属性则返回true，否则返回false
   */
  private trySetDirectProperty<T extends Element>(el: T, name: string, value: any): boolean {
    // 检查元素是否具有指定的属性
    if (!(name in el)) return false
    try {
      el[name as keyof T] = value
    } catch {
      return false
    }
    return true
  }
  /**
   * 移除元素的事件监听器
   *
   * @param el - 元素实例
   * @param {string} name - 事件名称
   * @param {Function} handler - 要移除的事件处理函数
   * @param {boolean} useCapture - 是否使用捕获阶段移除事件监听器
   * @returns {void}
   * @description 移除元素上指定的事件监听器
   * @example
   * // 移除点击事件监听器
   * element.removeEventListener("click", clickHandler);
   */
  private removeEventListener(
    el: Element,
    name: string,
    handler: (...args: any[]) => any,
    useCapture: boolean = false
  ): void {
    const { event, options } = this.extractEventOptions(name)
    useCapture = options.capture ?? useCapture
    el.removeEventListener(event, handler as any, useCapture)
  }
  /**
   * 为元素添加事件监听器
   *
   * @param el - 元素实例
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
  private addEventListener(
    el: Element,
    name: string,
    handler: (...args: any[]) => any,
    options?: HTMLEventOptions
  ): void {
    const { event, options: eventOptions } = this.extractEventOptions(name)
    Object.assign(eventOptions, options)
    el.addEventListener(event, handler as any, eventOptions)
  }
  /**
   * 恢复片段节点的子节点
   *
   * @template T - 任意DOM元素实例
   * @param el - 片段节点
   * @returns {T} 返回恢复后的片段元素
   */
  private recoveryFragmentChildren<T extends HostNode>(el: T): T {
    if (this.isFragment(el)) {
      if (el.childNodes.length === 0) {
        const children = el.$view.children
        el.appendChild(el.$startAnchor)
        // 递归恢复片段节点
        for (const child of children) {
          if (child.node) {
            el.appendChild(this.recoveryFragmentChildren(child.node))
          }
        }
        el.appendChild(el.$endAnchor)
      } else if (!el.contains(el.$startAnchor)) {
        // 兼容片段首次插入到父节点时的恢复操作操作
        el.insertBefore(el.$startAnchor, el.childNodes[0])
        el.appendChild(el.$endAnchor)
      }
    }
    return el
  }
  /**
   * 获取指定标签的属性默认值（带缓存）
   */
  private getDefaultValue(tag: string, prop: string): any {
    tag = tag.toLowerCase()

    // 获取标签缓存
    let tagCache = DEFAULT_PROPERTIES_CACHE.get(tag)
    if (!tagCache) {
      tagCache = DEFAULT_PROPERTIES_CACHE.set(tag, Object.create(null))
    }
    let value: any
    // 缓存命中
    if (prop in tagCache) {
      value = tagCache[prop]
    } else {
      // 未命中 → 创建元素获取默认值
      const el = document.createElement(tag)
      value = (el as any)[prop]
      tagCache[prop] = value
    }

    if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
      return value
    }

    return undefined
  }
  /**
   * 提取事件选项
   *
   * @internal 用于绑定事件时提取事件选项
   * @param {string} name 事件名称
   * @returns {object} 包含事件名和选项的对象
   * @example
   * extractEventOptions('onclick') // { event: 'click', options: {} }
   * extractEventOptions('onClickCapture') // { event: 'click', options: { capture: true } }
   * extractEventOptions('onClickCaptureOnce') // { event: 'click', options: { capture: true, once: true } }
   */
  private extractEventOptions(name: string): { event: string; options: HTMLEventOptions } {
    const options = {} as HTMLEventOptions
    let event = name.toLowerCase()
    if (event.startsWith('on')) event = event.slice(2)
    if (event.endsWith('passive')) {
      event = event.slice(0, -7)
      options.passive = true
    }
    if (event.endsWith('once')) {
      event = event.slice(0, -4)
      options.once = true
    }
    if (event.endsWith('capture')) {
      event = event.slice(0, -7)
      options.capture = true
    }
    return { event, options }
  }
}
