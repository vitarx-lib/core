import { unref } from '@vitarx/responsive'
import type {
  ClassProperties,
  EventNames,
  EventOptions,
  FragmentElement,
  RuntimeElement,
  StyleProperties,
  StyleRules
} from '../vnode/index.js'
import { StyleHandler } from './style-handler.js'

const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink'

const DEFAULT_PROPERTIES_CACHE = new Map<string, Record<string, any>>()
/**
 * DomHelper 类提供了一系列用于操作 DOM 元素的静态方法。
 * 该类主要用于处理元素的属性、样式、类名、事件监听以及 DOM 操作等常见任务。
 *
 * 核心功能包括：
 * - 样式和类名的处理（合并、转换）
 * - 属性的设置、获取和移除
 * - 事件监听器的添加和移除
 * - DOM 元素的插入、替换、移除等操作
 * - 片段元素的特殊处理
 *
 * 使用示例：
 * ```typescript
 * // 设置元素的样式
 * DomHelper.setStyle(element, { color: 'red', fontSize: '14px' });
 *
 * // 设置元素的类名
 * DomHelper.setClass(element, 'active');
 *
 * // 设置元素的属性
 * DomHelper.setAttribute(element, 'data-id', '123');
 *
 * // 添加事件监听
 * DomHelper.addEventListener(element, 'click', handleClick);
 *
 * // 插入元素
 * DomHelper.insertBefore(newElement, targetElement);
 * ```
 *
 * 注意事项：
 * - 类中的样式处理方法已被标记为 deprecated，建议使用 StyleHandler 类中的对应方法替代
 * - 在处理片段元素时，需要特别注意其特殊性，确保正确处理锚点节点
 * - 某些 DOM 操作可能会抛出错误，建议在使用时添加适当的错误处理
 * - 通常DOM操作是由框架内部调用的，谨慎操作真实DOM，可能会导致布局错乱等非预期错误
 */
export class DomHelper {
  /**
   * 合并两个class
   *
   * 返回值类型和第一个参数类型一致
   *
   * @deprecated 请使用 `StyleHandler.mergeCssClass`
   * @param {ClassProperties} c1 - class1
   * @param {ClassProperties} c2 - class2
   * @returns {string[]} 合并后的数组，数组元素为类名
   */
  static mergeCssClass(c1: ClassProperties, c2: ClassProperties): string[] {
    return StyleHandler.mergeCssClass(c1, c2)
  }

  /**
   * 合并两个style
   *
   * @deprecated 请使用 `StyleHandler.mergeCssStyle`
   * @param {StyleProperties} style1 - 第一个样式对象或字符串
   * @param {StyleProperties} style2 - 第二个样式对象或字符串
   * @returns {StyleRules} 合并后的style对象
   */
  static mergeCssStyle(style1: StyleProperties, style2: StyleProperties): StyleRules {
    return StyleHandler.mergeCssStyle(style1, style2)
  }

  /**
   * 将style对象转换为字符串
   *
   * @deprecated 请使用 `StyleHandler.cssStyleValueToString`
   * @param {StyleProperties} styleObj - style对象
   * @returns {string} 转换后的style字符串
   */
  static cssStyleValueToString(styleObj: StyleProperties): string {
    return StyleHandler.cssStyleValueToString(styleObj)
  }

  /**
   * 将style字符串转换为style对象
   *
   * 如果是对象，则会直接返回
   *
   * @deprecated 请使用 `StyleHandler.cssStyleValueToObject`
   * @param {StyleProperties} style - style字符串
   * @returns {StyleRules}  转换后的style对象
   */
  static cssStyleValueToObject(style: StyleProperties): StyleRules {
    return StyleHandler.cssStyleValueToObject(style)
  }

  /**
   * 将 class 属性转换为数组
   *
   * @deprecated 请使用 `StyleHandler.cssClassValueToArray`
   * @param {ClassProperties} classInput - 可以是 string, string[] 或对象类型
   * @returns {string[]} 返回一个数组，数组元素为类名
   */
  static cssClassValueToArray(classInput: ClassProperties): string[] {
    return StyleHandler.cssClassValueToArray(classInput)
  }

  /**
   * 将 class 属性转换为字符串
   *
   * @deprecated 请使用 `StyleHandler.cssClassValueToString`
   * @param {ClassProperties} classInput - 可以是 string, string[] 或对象类型
   * @returns {string} 返回一个字符串，字符串元素为类名
   */
  static cssClassValueToString(classInput: ClassProperties): string {
    return StyleHandler.cssClassValueToString(classInput)
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
  static extractEventOptions(name: string): { event: string; options: EventOptions } {
    const options = {} as EventOptions
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
   * 设置元素的样式
   *
   * @description 设置元素的样式，包括设置样式属性和样式对象
   * @param el - 元素实例
   * @param style - 样式属性或样式对象
   * @returns {void}
   */
  static setStyle(el: HTMLElement | SVGElement, style: StyleProperties): void {
    const cssText = StyleHandler.cssStyleValueToString(style)
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
    const className = StyleHandler.cssClassValueToString(classValue)
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
   * @param [oldValue] - 旧属性值，仅用于更新事件时使用
   * @returns {void}
   */
  static setAttribute<T extends HTMLElement | SVGElement>(
    el: T,
    name: string,
    value: any,
    oldValue?: any
  ): void {
    value = unref(value)
    if (value === undefined) {
      this.removeAttribute(el, name, oldValue)
      return
    }
    // 处理特殊属性
    if (this.isSpecialAttribute(name)) {
      this.handleSpecialAttribute(el, name, value)
      return
    }

    // 处理事件属性
    if (typeof value === 'function') {
      this.handleEventAttribute(el, name as EventNames, value, oldValue)
      return
    }

    // 处理 data 属性
    if (name.startsWith('data-')) {
      this.handleDataAttribute(el, name, value)
      return
    }
    // 处理普通属性
    this.handleRegularAttribute(el, name, value)
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
   * 移除元素的指定属性（兼容事件、特殊属性、默认值恢复）
   *
   * @param el - 元素实例
   * @param name - 要移除的属性名
   * @param oldValue - 如果是事件属性则必须传入事件处理器函数
   */
  static removeAttribute(el: HTMLElement | SVGElement, name: string, oldValue?: any): void {
    if (!el || !name) return

    // --- 1. class 特殊处理 ---
    if (name === 'class' || name === 'className' || name === 'classname') {
      el.removeAttribute('class')
      return
    }

    // --- 2. 事件属性 ---
    if (typeof oldValue === 'function' && name.startsWith('on')) {
      this.removeEventListener(el, name as EventNames, oldValue)
      return
    }

    // --- 3. 还原属性到默认值 ---
    const tag = el.tagName.toLowerCase()
    const defaultValue = this.getDefaultValueForProperty(tag, name)

    // 判断是否是有效的 JS property
    if (name in el) {
      try {
        const currentValue = (el as any)[name]
        const type = typeof currentValue

        if (type === 'string') {
          ;(el as any)[name] = defaultValue ?? ''
        } else if (type === 'boolean') {
          ;(el as any)[name] = defaultValue ?? false
        } else if (type === 'number') {
          ;(el as any)[name] = defaultValue ?? 0
        } else {
          // 兜底设置 undefined
          ;(el as any)[name] = defaultValue ?? undefined
        }
      } catch {
        // 一些只读属性（如 innerHTML）会抛异常，退回到 removeAttribute
        el.removeAttribute(name)
      }
    } else {
      // --- 4. 普通 attribute ---
      el.removeAttribute(name)
    }
  }

  /**
   * 获取目标DOM节点的第一个子元素
   *
   * 兼容片段节点
   *
   * @param target - 目标节点
   * @returns {Node|null} 返回第一个子节点，如果不存在则返回null
   */
  static getFirstChildElement(target: Node): Node | null {
    if (this.isFragmentElement(target)) {
      return target.$children[0].element
    }
    return target.firstChild
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
  static addEventListener(
    el: HTMLElement | SVGElement,
    name: EventNames,
    handler: (...args: any[]) => any,
    options?: EventOptions
  ): void {
    const { event, options: eventOptions } = this.extractEventOptions(name)
    Object.assign(eventOptions, options)
    el.addEventListener(event, handler as any, eventOptions)
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
  static removeEventListener(
    el: HTMLElement | SVGElement,
    name: EventNames,
    handler: (...args: any[]) => any,
    useCapture: boolean = false
  ): void {
    const { event, options } = this.extractEventOptions(name)
    useCapture = options.capture ?? useCapture
    el.removeEventListener(event, handler as any, useCapture)
  }

  /**
   * 在指定的锚点节点之前插入新的子元素
   *
   * @param child - 要插入的子元素
   * @param anchor - 锚点节点
   * @returns {ParentNode} - 父节点元素
   * @throws {Error} - 如果锚点节点没有父节点，则抛出错误
   */
  static insertBefore(child: Node, anchor: Node): ParentNode {
    // 兼容Fragment
    child = this.recoveryFragmentChildNodes(child)
    // 如果锚点元素是Fragment，则插入到第一个子元素
    if (this.isFragmentElement(anchor)) {
      anchor = anchor.$startAnchor
    }
    // 获取锚点元素的父级元素
    const parent = anchor.parentNode
    if (!parent) {
      throw new Error(
        '[Vitarx.DomHelper.insertBefore][ERROR]: The anchor element does not have a parent node'
      )
    }
    parent.insertBefore(child, anchor)
    return parent
  }
  /**
   * 在指定的锚点节点之后插入新的子元素
   *
   * @param child - 要插入的子元素
   * @param anchor - 锚点节点
   * @returns {ParentNode} - 父节点元素
   */
  static insertAfter(child: Node, anchor: Node): ParentNode {
    child = this.recoveryFragmentChildNodes(child)
    if (this.isFragmentElement(anchor)) {
      anchor = anchor.$endAnchor
    }
    const parent = anchor.parentNode
    if (!parent) {
      throw new Error(
        '[Vitarx.DomHelper.insertAfter][ERROR]: The anchor element does not have a parent node'
      )
    }
    const next = anchor.nextSibling
    if (next) {
      parent.insertBefore(child, next)
    } else {
      parent.appendChild(child)
    }
    return parent
  }
  /**
   * 获取元素的父级元素
   *
   * @param {Node} target - 目标DOM节点
   * @returns {Node | null} 返回父级真实DOM元素，如果不存在则返回null
   */
  static getParentElement(target: Node): ParentNode | null {
    if (this.isFragmentElement(target)) {
      return target.$startAnchor.parentNode
    }
    return target?.parentNode ?? null
  }
  /**
   * 获取目标节点的下一个兄弟节点
   *
   * 兼容片段节点
   *
   * @param target - 目标DOM节点
   * @returns 返回下一个兄弟节点，如果不存在则返回null
   */
  static getNextElement(target: Node): Node | null {
    // 如果目标是片段元素，则返回其结束锚点的下一个兄弟节点
    if (this.isFragmentElement(target)) {
      return target.$endAnchor.nextSibling
    }
    // 否则返回目标节点的下一个兄弟节点，如果不存在则返回null
    return target?.nextSibling ?? null
  }
  /**
   * 获取目标DOM节点的前一个兄弟节点
   *
   * 兼容片段节点
   *
   * @param target - 目标DOM节点
   * @returns {Node|null} 返回前一个兄弟节点，如果不存在则返回null
   */
  static getPrevElement(target: Node): Node | null {
    // 如果目标是片段元素，则返回片段起始锚点的前一个兄弟节点
    if (this.isFragmentElement(target)) {
      return target.$startAnchor.previousSibling
    }
    // 否则返回目标节点的前一个兄弟节点，如果不存在则返回null
    return target?.previousSibling ?? null
  }
  /**
   * 获取目标DOM节点的最后一个子元素
   *
   * 兼容片段节点
   *
   * @param target - 目标节点
   * @returns {Node|null} 获取目标DOM节点的最后一个子元素，如果目标节点没有子元素则返回null
   */
  static getLastChildElement(target: Node): Node | null {
    if (this.isFragmentElement(target)) {
      return target.$children[target.$children.length - 1]?.element ?? null
    }
    return target.lastChild
  }

  /**
   * 判断是否为Vitarx特殊的片段元素
   *
   * @param el
   */
  static isFragmentElement(el: any): el is FragmentElement {
    return !!(el && el instanceof DocumentFragment && '$startAnchor' in el)
  }
  /**
   * 替换元素方法
   *
   * 将旧元素替换为新元素。如果旧元素是DocumentFragment，则将其第一个子元素替换为新元素；
   * 否则直接替换旧元素为其父元素中的新元素。
   *
   * @param newEl - 要插入的新元素
   * @param oldEl - 要被替换的旧元素
   * @throws {Error} 如果旧元素是DocumentFragment且没有子元素，则抛出错误
   * @throws {Error} 如果要被替换的元素没有父节点，则抛出错误
   */
  static replace(newEl: Node, oldEl: Node): void {
    newEl = this.recoveryFragmentChildNodes(newEl)
    if (this.isFragmentElement(oldEl)) {
      const startAnchor = oldEl.$startAnchor
      const parent = startAnchor.parentNode
      if (!parent) {
        throw new Error(
          '[Vitarx.DomHelper.replace][ERROR]: The old element does not have a parent element'
        )
      }
      parent.insertBefore(newEl, startAnchor)
      // 移除旧元素
      oldEl.$children.forEach(child => this.remove(child.element))
      // 移除旧元素开始锚点
      startAnchor.remove()
      // 移除旧元素结束锚点
      oldEl.$endAnchor.remove()
    } else {
      const parent = oldEl.parentNode
      if (!parent) {
        throw new Error(
          '[Vitarx.DomHelper.replace][ERROR]: The old element does not have a parent element'
        )
      }
      // 替换新元素
      parent.replaceChild(newEl, oldEl)
    }
  }
  /**
   * 给指定容器元素附加子元素
   *
   * @param target - 容器，可以是所有继承了ParentNode的元素实例
   * @param el - 要挂载的元素
   * @returns {void} 无返回值
   */
  static appendChild(target: Node, el: Node): void {
    el = this.recoveryFragmentChildNodes(el)
    // 如果是插入到片段节点中，则判断是否已挂载
    if (this.isFragmentElement(target) && target.$endAnchor.parentNode) {
      const endAnchor = target.$endAnchor
      endAnchor.parentNode!.insertBefore(el, endAnchor)
    } else {
      target.appendChild(el)
    }
  }
  /**
   * 从DOM中移除虚拟节点对应的真实元素
   *
   * @param {Node} target - 待移除的元素
   */
  static remove(target: RuntimeElement): void {
    if (!this.isFragmentElement(target)) {
      return target.remove()
    }
    target.$startAnchor.remove()
    const children = target.$children
    if (children?.length) {
      children.forEach(child => this.remove(child.element))
    }
    target.$endAnchor.remove()
  }
  /**
   * 恢复片段节点的子节点
   *
   * @template T - 任意DOM元素实例
   * @param el - 片段节点
   * @returns {T} 返回恢复后的片段元素
   */
  static recoveryFragmentChildNodes<T extends Node>(el: T): T {
    if (this.isFragmentElement(el)) {
      if (el.childNodes.length === 0) {
        el.appendChild(el.$startAnchor)
        // 递归恢复片段节点
        for (let i = 0; i < el.$children.length; i++) {
          const childVNode = el.$children[i]
          const childEl = childVNode.teleport ? childVNode.shadowElement : childVNode.element
          el.appendChild(this.recoveryFragmentChildNodes(childEl))
        }
        el.appendChild(el.$endAnchor)
      }
    }
    return el
  }

  /**
   * 获取指定标签的属性默认值（带缓存）
   */
  private static getDefaultValueForProperty(tag: string, prop: string): any {
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

  /**
   * 判断是否为特殊属性
   * @param name - 属性名
   * @returns {boolean} 如果是特殊属性则返回true，否则返回false
   */
  private static isSpecialAttribute(name: string): boolean {
    return ['style', 'className', 'classname', 'class', 'v-html', 'autoFocus'].includes(name)
  }
  /**
   * 处理特殊属性
   * @param el - 元素实例
   * @param name - 属性名
   * @param value - 属性值
   */
  private static handleSpecialAttribute(
    el: HTMLElement | SVGElement,
    name: string,
    value: any
  ): void {
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
        el.innerHTML = value
        break
      case 'autoFocus':
        el.autofocus = value
        break
    }
  }
  /**
   * 处理事件属性
   * @param el - 元素实例
   * @param name - 事件名称
   * @param value - 新事件处理函数
   * @param oldValue - 旧事件处理函数
   */
  private static handleEventAttribute(
    el: HTMLElement | SVGElement,
    name: EventNames,
    value: (...args: any[]) => any,
    oldValue?: any
  ): void {
    if (oldValue === value) return
    // 清除旧事件
    if (typeof oldValue === 'function') {
      this.removeEventListener(el, name, oldValue)
    }
    // 绑定新事件
    this.addEventListener(el, name, value)
  }
  /**
   * 处理 data 属性
   * @param el - 元素实例
   * @param name - 属性名
   * @param value - 属性值
   */
  private static handleDataAttribute(el: HTMLElement | SVGElement, name: string, value: any): void {
    el.dataset[name.slice(5)] = value
  }
  /**
   * 处理普通属性
   * @param el - 元素实例
   * @param name - 属性名
   * @param value - 属性值
   */
  private static handleRegularAttribute(
    el: HTMLElement | SVGElement,
    name: string,
    value: any
  ): void {
    try {
      // 特殊处理xmlns:xlink
      if (name === 'xmlns:xlink') {
        el.setAttributeNS(XMLNS_NAMESPACE, name, String(value))
        return
      }
      // 处理 xlink 属性
      if (name.startsWith('xlink:')) {
        el.setAttributeNS(XLINK_NAMESPACE, name, String(value))
        return
      }
      // 尝试直接设置属性
      if (this.trySetDirectProperty(el, name, value)) {
        return
      }
      // 使用 setAttribute 作为后备方案
      el.setAttribute(name, String(value))
    } catch (error) {
      this.handleAttributeError(name, error, el)
    }
  }

  /**
   * 尝试直接设置属性
   * @param el - 要设置属性的元素对象
   * @param name - 属性名称
   * @param value - 属性值
   * @returns {boolean} 如果成功设置属性则返回true，否则返回false
   */
  private static trySetDirectProperty<T extends HTMLElement | SVGElement>(
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
   * 处理属性设置错误
   * @param name - 属性名
   * @param error - 错误信息
   * @param el - 元素实例
   */
  private static handleAttributeError(
    name: string,
    error: any,
    el: HTMLElement | SVGElement
  ): void {
    console.error(`[Vitarx.DomHelper.setAttribute][ERROR]：设置属性 ${name} 时发生错误`, error, el)
  }
}
