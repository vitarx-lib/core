import { toRaw, unref } from '@vitarx/responsive'
import { isRecordObject, isString, toCamelCase, toKebabCase } from '@vitarx/utils'
import type {
  ClassProperties,
  EventNames,
  EventOptions,
  FragmentElement,
  RuntimeElement,
  StyleProperties,
  StyleRules
} from '../vnode/index.js'

/**
 * DOM操作类
 *
 * 包含一些常用的DOM操作方法
 */
export class DomHelper {
  /**
   * 合并两个class
   *
   * 返回值类型和第一个参数类型一致
   *
   * @param {ClassProperties} c1 - class1
   * @param {ClassProperties} c2 - class2
   * @returns {string[]} 合并后的数组，数组元素为类名
   */
  static mergeCssClass(c1: ClassProperties, c2: ClassProperties): string[] {
    // 将 c1 和 c2 转换为数组
    const arr1 = this.cssClassValueToArray(c1)
    const arr2 = this.cssClassValueToArray(c2)

    // 合并并去重
    return Array.from(new Set([...arr1, ...arr2]))
  }

  /**
   * 合并两个style
   *
   * @param {StyleProperties} style1 - 第一个样式对象或字符串
   * @param {StyleProperties} style2 - 第二个样式对象或字符串
   * @returns {StyleRules} 合并后的style对象
   */
  static mergeCssStyle(style1: StyleProperties, style2: StyleProperties): StyleRules {
    // 如果style1是字符串，先转换为对象
    const obj1 = this.cssStyleValueToObject(style1)
    // 如果style2是字符串，先转换为对象
    const obj2 = this.cssStyleValueToObject(style2)

    // 合并对象，后者覆盖前者
    return { ...obj1, ...obj2 }
  }

  /**
   * 将style对象转换为字符串
   *
   * @param {StyleProperties} styleObj - style对象
   * @returns {string} 转换后的style字符串
   */
  static cssStyleValueToString(styleObj: StyleProperties): string {
    if (!styleObj) return ''
    if (isString(styleObj)) return styleObj
    if (!isRecordObject(styleObj)) return ''
    const styles: Array<string> = []
    Object.keys(styleObj).forEach(key => {
      const value = toRaw(styleObj[key as any]!)
      const type = typeof value
      const isValid = type === 'number' || type === 'string'
      if (isValid) {
        styles.push(`${toKebabCase(key)}: ${value}`)
      }
    })
    return styles.join('; ')
  }

  /**
   * 将style字符串转换为style对象
   *
   * 如果是对象，则会直接返回
   *
   * @param {StyleProperties} style - style字符串
   * @returns {StyleRules}  转换后的style对象
   */
  static cssStyleValueToObject(style: StyleProperties): StyleRules {
    if (isString(style)) {
      const styleObj: Record<string, any> = {}
      style.split(';').forEach(styleRule => {
        const [key, value] = styleRule.split(':').map(s => s?.trim())
        if (key && value) {
          styleObj[toCamelCase(key)] = value // 转为驼峰命名
        }
      })
      return styleObj as StyleRules
    } else if (isRecordObject(style)) {
      return style
    }
    return {}
  }

  /**
   * 将 class 属性转换为数组
   *
   * @param {ClassProperties} classInput - 可以是 string, string[] 或对象类型
   * @returns {string[]} 返回一个数组，数组元素为类名
   */
  static cssClassValueToArray(classInput: ClassProperties): string[] {
    if (typeof classInput === 'string') {
      return classInput.split(' ').filter(Boolean)
    }

    if (Array.isArray(classInput)) {
      return classInput
    }

    if (typeof classInput === 'object' && classInput !== null) {
      // 如果是对象类型，返回键名数组
      return Object.keys(classInput).filter(key => classInput[key])
    }

    return []
  }

  /**
   * 将 class 属性转换为字符串
   *
   * @param {ClassProperties} classInput - 可以是 string, string[] 或对象类型
   * @returns {string} 返回一个字符串，字符串元素为类名
   */
  static cssClassValueToString(classInput: ClassProperties): string {
    if (typeof classInput === 'string') {
      return classInput.trim()
    }
    if (Array.isArray(classInput)) {
      return classInput
        .map(item => item?.trim())
        .filter(Boolean)
        .join(' ')
    }
    if (typeof classInput === 'object' && classInput !== null) {
      // 如果是对象类型，返回键名数组
      return Object.keys(classInput)
        .filter(key => classInput[key])
        .join(' ')
    }
    return ''
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
    const cssText = this.cssStyleValueToString(style)
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
    const className = this.cssClassValueToString(classValue)
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
  static setAttribute(
    el: HTMLElement | SVGElement,
    name: string,
    value: any,
    oldValue?: any
  ): void {
    value = unref(value)

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
   * 移除元素的指定属性
   *
   * @param el - 元素实例
   * @param {string} name - 要移除的属性名
   * @param {any} oldValue - 如果是事件属性则必须传入事件处理器函数
   * @returns {void}
   */
  static removeAttribute(el: HTMLElement | SVGElement, name: string, oldValue?: any): void {
    if (name === 'className' || name === 'classname' || name === 'class') {
      el.removeAttribute('class')
    } else if (typeof oldValue === 'function') {
      this.removeEventListener(el, name as EventNames, oldValue)
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
  static insertBefore(child: RuntimeElement, anchor: RuntimeElement): ParentNode {
    const parent = this.getParentElement(anchor)
    if (!parent) throw new Error('The anchor element does not have a parent node')
    if (child instanceof DocumentFragment) {
      child = this.recoveryFragmentChildNodes(child)
    }
    if (anchor instanceof DocumentFragment) {
      const el = this.getFirstChildElement(anchor)
      parent.insertBefore(child, el)
      this.remove(anchor)
    } else {
      parent.insertBefore(child, anchor)
    }
    return parent
  }

  /**
   * 在指定的锚点节点之后插入新的子元素
   *
   * @param child - 要插入的子元素
   * @param anchor - 锚点节点
   * @returns {ParentNode} - 父节点元素
   */
  static insertAfter(child: RuntimeElement, anchor: RuntimeElement): ParentNode {
    const parent = this.getParentElement(anchor)
    if (!parent) throw new Error('The anchor element does not have a parent node')
    if (child instanceof DocumentFragment) {
      child = this.recoveryFragmentChildNodes(child)
    }
    if (anchor instanceof DocumentFragment) {
      anchor = this.getLastChildElement(anchor)!
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
   * 获取虚拟节点的父级真实DOM元素
   *
   * @param {RuntimeElement} target - 目标元素
   * @returns {RuntimeElement | null} 返回父级真实DOM元素，如果不存在则返回null
   */
  static getParentElement(target: RuntimeElement): ParentNode | null {
    if (target instanceof DocumentFragment) {
      return this.getFirstChildElement(target)?.parentNode ?? null
    }
    return target?.parentNode ?? null
  }

  /**
   * 获取元素的第一个子元素
   *
   * @param {RuntimeElement} target - 目标元素
   * @returns {RuntimeElement | null} 返回第一个子元素，如果不存在则返回null
   */
  static getFirstChildElement(target: RuntimeElement): RuntimeElement | null {
    return this.getChild(target, 'first')
  }

  /**
   * 获取元素的最后一个子元素
   *
   * @param {RuntimeElement} target - 目标元素
   * @returns {RuntimeElement | null} 返回最后一个子元素，如果不存在则返回null
   */
  static getLastChildElement(target: RuntimeElement): RuntimeElement | null {
    return this.getChild(target, 'last')
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
  static replace(newEl: RuntimeElement, oldEl: RuntimeElement): void {
    if (newEl instanceof DocumentFragment) {
      newEl = this.recoveryFragmentChildNodes(newEl)
    }
    if (oldEl instanceof DocumentFragment) {
      const oldFirstEl = this.getFirstChildElement(oldEl)
      if (!oldFirstEl) throw new Error('empty fragment')
      // 插入新元素
      this.insertBefore(newEl, oldFirstEl)
      this.remove(oldEl)
    } else {
      const parent = this.getParentElement(oldEl)
      if (!parent) throw new Error('The old element does not have a parent element')
      // 替换新元素
      parent.replaceChild(newEl, oldEl)
    }
  }

  /**
   * 给指定容器元素附加子元素
   *
   * @param container - 容器，可以是所有继承了ParentNode的元素实例
   * @param el - 要挂载的元素
   * @returns 无返回值
   */
  static appendChild(container: ParentNode, el: RuntimeElement): void {
    if (el instanceof DocumentFragment) {
      el = this.recoveryFragmentChildNodes(el)
    }
    container.appendChild(el)
  }

  /**
   * 从DOM中移除虚拟节点对应的真实元素
   *
   * @param {RuntimeElement} target - 待移除的元素
   */
  static remove(target: RuntimeElement): void {
    if (!(target instanceof DocumentFragment)) {
      return target.remove()
    }
    const children = target.$vnode.children
    if (children?.length) {
      children.forEach(child => child.element && this.remove(child.element))
    } else if (target.$vnode.hasShadowElement()) {
      target.$vnode.shadowElement.remove()
    }
  }

  /**
   * 恢复片段节点的子节点
   *
   * @param el - 片段节点
   * @returns 返回恢复后的片段元素
   */
  static recoveryFragmentChildNodes(el: FragmentElement): FragmentElement {
    if (el.childNodes.length === 0) {
      const vnode = el.$vnode
      // 递归恢复片段节点
      for (let i = 0; i < vnode.children.length; i++) {
        const childVNode = vnode.children[i]
        let childEl = childVNode.element
        if (childVNode.type === 'fragment-node' && childEl instanceof DocumentFragment) {
          childEl = this.recoveryFragmentChildNodes(childVNode.element as FragmentElement)
        }
        el.appendChild(childEl!)
      }
    }
    return el
  }

  /**
   * 获取元素的子元素
   *
   * @param target - 目标元素
   * @param type - 子元素类型（first 或 last）
   * @protected
   */
  protected static getChild(target: RuntimeElement, type: 'first' | 'last'): RuntimeElement | null {
    // 检查元素是否具有children属性
    if (!('children' in target)) return null
    // 处理DocumentFragment类型的情况
    if (target instanceof DocumentFragment) {
      const fragmentVNode = target.$vnode
      const index = type === 'first' ? 0 : fragmentVNode.children.length - 1
      // 获取虚拟节点并递归处理
      const childVNode = fragmentVNode.children[index]
      target = childVNode.element
      // 如果最后一个子节点仍然是DocumentFragment，递归调用
      return target instanceof DocumentFragment ? this.getChild(target, type) : target
    }
    const child = target[`${type}Child`]
    // 返回最后一个子元素，确保lastChild存在
    return child ? (child as RuntimeElement) : null
  }

  /**
   * 判断是否为特殊属性
   * @param name - 属性名
   * @returns {boolean} 如果是特殊属性则返回true，否则返回false
   */
  private static isSpecialAttribute(name: string): boolean {
    return ['style', 'className', 'classname', 'class', 'v-html'].includes(name)
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
        el.setAttributeNS('http://www.w3.org/2000/xmlns/', name, value)
        return
      }
      // 处理 xlink 属性
      if (name.startsWith('xlink:')) {
        el.setAttributeNS('http://www.w3.org/1999/xlink/', name, String(value))
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
   * @returns 如果成功设置属性则返回true，否则返回false
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
    console.error(`[Vitarx][ERROR]：设置属性 ${name} 时发生错误`, error, el)
  }
}
