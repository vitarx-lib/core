import {
  type DOMRect,
  type ElementVNode,
  type FragmentVNode,
  getNodeDomOpsTarget,
  type HostCommentElement,
  type HostElementNames,
  type HostElements,
  type HostFragmentElement,
  type HostNodeElements,
  type HostParentElement,
  type HostRegularElements,
  type HostRenderer,
  type HostTextElement,
  type HostVoidElementNames,
  type StyleProperties,
  StyleUtils
} from '@vitarx/runtime-core'
import type { HTMLEventOptions } from '../types/index.js'

/**
 * Void 元素集合(不支持子元素的自闭合标签)
 */
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr'
])

const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink'

const DEFAULT_PROPERTIES_CACHE = new Map<string, Record<string, any>>()

/**
 * Web渲染器类，实现了HostRenderer接口，用于在浏览器环境中进行DOM操作和渲染。
 *
 * 主要功能：
 * - 创建和管理DOM元素、文本节点、注释节点和文档片段
 * - 处理DOM节点的插入、删除、替换和属性操作
 * - 管理CSS类和样式
 * - 处理事件监听器的添加和移除
 * - 提供动画和过渡相关的工具方法
 *
 * 特殊说明：
 * - 该类专门用于浏览器环境，依赖于浏览器的DOM API
 * - 在处理Fragment节点时会特殊处理，确保正确维护其子节点
 * - 支持SVG元素的创建和操作
 * - 提供了完善的错误处理机制
 * - 此类实例注册在运行时核心中，用于处理浏览器环境下的DOM操作和渲染。
 */
export class DomRenderer implements HostRenderer {
  /** @inheritDoc */
  createElement<T extends HostElementNames>(vnode: ElementVNode<T>): HostElements<T> {
    let el: HostElements<T>
    const { type, isSVGElement, props } = vnode
    if (isSVGElement) {
      el = document.createElementNS('http://www.w3.org/2000/svg', type) as HostElements<T>
    } else {
      el = document.createElement(type) as HostElements<T>
    }
    this.setAttributes(el, props)
    return el
  }

  /** @inheritDoc */
  isContainer(el: HostNodeElements): boolean {
    // DocumentFragment 是容器
    if (el.nodeType === Node.DOCUMENT_FRAGMENT_NODE) return true
    // 元素节点且非 void 元素才是容器
    if (el.nodeType === Node.ELEMENT_NODE) {
      const tag = (el as HTMLElement).tagName.toLowerCase()
      return !this.isVoidElement(tag)
    }
    return false
  }

  /** @inheritDoc */
  createFragment(vnode: FragmentVNode): HostFragmentElement {
    const el = document.createDocumentFragment() as HostFragmentElement
    el.$startAnchor = document.createComment('Fragment start')
    el.$endAnchor = document.createComment('Fragment end')
    el.$vnode = vnode
    return el
  }

  /** @inheritDoc */
  createText(text: string): HostTextElement {
    return document.createTextNode(text)
  }

  /** @inheritDoc */
  createComment(text: string): HostCommentElement {
    return document.createComment(text)
  }

  /** @inheritDoc */
  isVoidElement(tag: string): tag is HostVoidElementNames {
    return VOID_ELEMENTS.has(tag)
  }

  /** @inheritDoc */
  isElement(el: HostNodeElements): el is HostElements {
    return el.nodeType === Node.ELEMENT_NODE || el.nodeType === Node.DOCUMENT_FRAGMENT_NODE
  }

  /** @inheritDoc */
  isFragment(el: HostNodeElements): el is HostFragmentElement {
    return el.nodeType === Node.DOCUMENT_FRAGMENT_NODE
  }

  /** @inheritDoc */
  remove(el: HostNodeElements): void {
    if (!this.isFragment(el)) return el.remove()
    const { $startAnchor: start, $endAnchor: end } = el
    const range = document.createRange()
    range.setStartBefore(start)
    range.setEndAfter(end)
    range.deleteContents()
  }
  /** @inheritDoc */
  insertBefore(child: HostNodeElements, anchor: HostNodeElements): void {
    // 兼容Fragment
    child = this.recoveryFragmentChildren(child)
    // 如果锚点元素是Fragment，则插入到第一个子元素
    if (this.isFragment(anchor)) {
      anchor = anchor.$startAnchor
    }
    // 获取锚点元素的父级元素
    const parent = anchor.parentNode
    if (!parent) {
      throw new Error(
        '[WebRenderer.insertBefore][ERROR]: The anchor element does not have a parent node'
      )
    }
    parent.insertBefore(child, anchor)
  }
  /** @inheritDoc */
  replace(newChild: HostNodeElements, oldChild: HostNodeElements): void {
    newChild = this.recoveryFragmentChildren(newChild)
    const isFragment = this.isFragment(oldChild)
    // 获取父节点，片段元素使用 startAnchor 的父节点
    const parent = isFragment ? oldChild.$startAnchor.parentNode : oldChild.parentNode

    if (!parent) {
      throw new Error(
        '[WebRenderer.replace][ERROR]: The old element does not have a parent element'
      )
    }

    // 片段元素需要在 startAnchor 之前插入，然后删除旧元素
    if (isFragment) {
      parent.insertBefore(newChild, oldChild.$startAnchor)
      this.remove(oldChild)
    } else {
      parent.replaceChild(newChild, oldChild)
    }
  }
  /** @inheritDoc */
  appendChild(
    el: HostNodeElements,
    parent: HostParentElement | HostRegularElements | HostFragmentElement
  ): void {
    el = this.recoveryFragmentChildren(el)
    // 如果是插入到片段节点中，则判断是否已挂载
    if (this.isFragment(parent) && parent.$endAnchor.parentNode) {
      const endAnchor = parent.$endAnchor
      endAnchor.parentNode!.insertBefore(el, endAnchor)
    } else {
      parent.appendChild(el)
    }
  }

  /** @inheritDoc */
  addStyle(el: HostElements, key: string, value: string): void {
    el.style.setProperty(key, value)
  }

  /** @inheritDoc */
  removeStyle(el: HostElements, key: string): void {
    el.style.removeProperty(key)
  }

  /** @inheritDoc */
  getBoundingClientRect(el: HostElements): DOMRect {
    return el.getBoundingClientRect()
  }

  /** @inheritDoc */
  setClass(el: HostElements, classValue: string[]): void {
    const className = StyleUtils.cssClassValueToString(classValue)
    if (el.className !== className) {
      el.setAttribute('class', className)
    }
    if (el.classList.length === 0) el.removeAttribute('class')
  }

  /** @inheritDoc */
  addClass(el: HostElements, className: string): void {
    if (className.includes(' ')) {
      StyleUtils.cssClassValueToArray(className).forEach(className => {
        el.classList.add(className)
      })
      return
    }
    el.classList.add(className)
  }

  /** @inheritDoc */
  removeClass(el: HostElements, className: string): void {
    if (className.includes(' ')) {
      StyleUtils.cssClassValueToArray(className).forEach(className => {
        el.classList.remove(className)
      })
      return
    }
    el.classList.remove(className)
  }

  /** @inheritDoc */
  requestAnimationFrame(fn: () => void): number {
    return requestAnimationFrame(fn)
  }

  /** @inheritDoc */
  cancelAnimationFrame(id: number): void {
    return cancelAnimationFrame(id)
  }

  /** @inheritDoc */
  setStyle(el: HostElements, style: StyleProperties): void {
    const cssText = StyleUtils.cssStyleValueToString(style)
    if (el.style.cssText !== cssText) {
      el.style.cssText = cssText
    }
    // 如果没有有效样式，移除 style 属性
    if (el.style.length === 0) el.removeAttribute('style')
  }
  /** @inheritDoc */
  getStyle(el: HostElements, key: string): string | null {
    return el.style.getPropertyValue(key) || null
  }

  /** @inheritDoc */
  setAttribute(el: HostElements, name: string, nextValue: any, prevValue?: any): void {
    try {
      if (nextValue === undefined || nextValue === null) {
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
        `[WebRenderer.setAttribute][ERROR]：an error occurred when setting the attribute ${name}`,
        error,
        el
      )
    }
  }
  /** @inheritDoc */
  removeAttribute(el: HostElements, key: string, prevValue?: any): void {
    // --- 1. class 特殊处理 ---
    if (key === 'class' || key === 'className' || key === 'classname') {
      el.removeAttribute('class')
      return
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
        ;(el as any)[key] = this.getDefaultValue(tag, key)
      } catch {
        // 一些只读属性（如 innerHTML）会抛异常，退回到 removeAttribute
        el.removeAttribute(key)
      }
    } else {
      // --- 4. 普通 attribute ---
      el.removeAttribute(key)
    }
  }

  /** @inheritDoc */
  setText(el: HostTextElement | HostCommentElement, value: string): void {
    el.textContent = value
  }

  /** @inheritDoc */
  querySelector(selector: string, container?: HostParentElement): HostElements | null {
    if (container) return container.querySelector(selector)
    return document.querySelector(selector)
  }
  /** @inheritDoc */
  querySelectorAll(selector: string, container?: HostParentElement): Iterable<HostElements> {
    return container ? container.querySelectorAll(selector) : document.querySelectorAll(selector)
  }
  /** @inheritDoc */
  getParentElement(el: HostNodeElements): HostParentElement | null {
    if (this.isFragment(el)) {
      return el.$startAnchor.parentNode as HostParentElement | null
    }
    return el.parentNode as HostParentElement | null
  }

  /** @inheritDoc */
  getAnimationDuration(el: HostElements): number {
    const styles = getComputedStyle(el)
    const delays = styles.animationDelay.split(',').map(s => this.parseTime(s))
    const durations = styles.animationDuration.split(',').map(s => this.parseTime(s))
    const times = durations.map((d, i) => d + (delays[i] || 0))
    return Math.max(...times, 0)
  }

  /** @inheritDoc */
  getTransitionDuration(el: HostElements): number {
    const styles = getComputedStyle(el)
    const delays = styles.transitionDelay.split(',').map(s => this.parseTime(s))
    const durations = styles.transitionDuration.split(',').map(s => this.parseTime(s))
    const times = durations.map((d, i) => d + (delays[i] || 0))
    return Math.max(...times, 0)
  }

  /**
   * 恢复片段节点的子节点
   *
   * @template T - 任意DOM元素实例
   * @param el - 片段节点
   * @returns {T} 返回恢复后的片段元素
   */
  private recoveryFragmentChildren<T extends HostNodeElements>(el: T): T {
    if (this.isFragment(el)) {
      if (el.childNodes.length === 0) {
        const children = el.$vnode.children
        el.appendChild(el.$startAnchor)
        // 递归恢复片段节点
        for (const child of children) {
          el.appendChild(this.recoveryFragmentChildren(getNodeDomOpsTarget(child)))
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
   * 设置元素的属性
   * @param el - 目标DOM元素
   * @param attrs - 需要设置的属性键值对对象
   */
  private setAttributes(el: HostElements, attrs: Record<string, any>): void {
    // 遍历属性对象的所有键值对
    Object.entries(attrs).forEach(([key, value]) => {
      // 为元素设置单个属性
      this.setAttribute(el, key, value)
    })
  }

  /**
   * 尝试直接设置属性
   * @param el - 要设置属性的元素对象
   * @param name - 属性名称
   * @param value - 属性值
   * @returns {boolean} 如果成功设置属性则返回true，否则返回false
   */
  private trySetDirectProperty<T extends HTMLElement | SVGElement>(
    el: T,
    name: string,
    value: any
  ): boolean {
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
    el: HTMLElement | SVGElement,
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
    el: HTMLElement | SVGElement,
    name: string,
    handler: (...args: any[]) => any,
    options?: HTMLEventOptions
  ): void {
    const { event, options: eventOptions } = this.extractEventOptions(name)
    Object.assign(eventOptions, options)
    el.addEventListener(event, handler as any, eventOptions)
  }
  /**
   * 将 "0.3s" / "120ms" 转换为毫秒数字
   */
  private parseTime(time: string): number {
    time = time.trim()
    if (time.endsWith('ms')) {
      return parseFloat(time)
    } else if (time.endsWith('s')) {
      return parseFloat(time) * 1000
    }
    return parseFloat(time) || 0
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

    // 缓存命中
    if (prop in tagCache) {
      return tagCache[prop]
    }

    // 未命中 → 创建元素获取默认值
    const el = document.createElement(tag)
    const value = (el as any)[prop]
    tagCache[prop] = value

    return value
  }
}
