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
import type { HTMLEventOptions } from '../types/index.js'

const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink'
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

export const __EXCLUDE_PROP_NAMES__ = [
  'className',
  'children',
  'innerHTML',
  'textContent',
  'nodeValue'
]

/**
 * 属性默认值缓存
 * 按标签名缓存属性的默认值，避免重复创建元素获取默认值
 * 结构: Map<tagName, Record<propName, defaultValue>>
 */
const DEFAULT_PROPERTIES_CACHE = new Map<string, Record<string, any>>()

/**
 * 预定义属性默认值表
 *
 * 性能优化：对于常见的 HTML 属性，直接预定义其默认值，
 * 避免在运行时动态创建 DOM 元素来获取默认值。
 *
 * 覆盖场景：
 * - 布尔属性：checked, disabled, hidden 等
 * - 字符串属性：value, placeholder, name 等
 * - 数值属性：tabIndex, width, height 等
 */
const PREDEFINED_DEFAULTS: Record<string, any> = {
  checked: false,
  selected: false,
  disabled: false,
  readOnly: false,
  multiple: false,
  autofocus: false,
  required: false,
  hidden: false,
  draggable: false,
  spellcheck: true,
  autocomplete: '',
  autocapitalize: '',
  autocorrect: '',
  contentEditable: 'inherit',
  dir: '',
  lang: '',
  tabIndex: 0,
  title: '',
  value: '',
  defaultValue: '',
  placeholder: '',
  name: '',
  type: 'text',
  src: '',
  href: '',
  rel: '',
  target: '',
  alt: '',
  width: 0,
  height: 0,
  id: '',
  accessKey: '',
  className: '',
  min: '',
  max: '',
  step: '',
  pattern: '',
  accept: '',
  action: '',
  method: 'get',
  enctype: 'application/x-www-form-urlencoded',
  cols: 20,
  rows: 2,
  wrap: 'soft',
  colSpan: 1,
  rowSpan: 1,
  span: 1,
  start: 1,
  reversed: false,
  async: false,
  defer: false,
  crossOrigin: null,
  integrity: '',
  nonce: '',
  referrerPolicy: '',
  loading: '',
  decoding: 'auto',
  playsInline: false,
  controls: false,
  autoplay: false,
  loop: false,
  muted: false,
  preload: '',
  poster: '',
  currentTime: 0,
  playbackRate: 1,
  volume: 1,
  defaultPlaybackRate: 1,
  defaultMuted: false,
  kind: '',
  srclang: '',
  label: '',
  default: false
}

/**
 * 需要重置默认值的属性集合
 *
 * 性能优化：按需重置策略
 * 当移除属性时，只有在此集合中的属性才会尝试重置到默认值，
 * 其他属性直接调用 removeAttribute 移除，避免不必要的默认值查询。
 *
 * 判断逻辑：
 * 1. prevValue === undefined → 属性从未设置，直接移除
 * 2. 属性不在集合中 → 直接移除
 * 3. 属性在集合中 → 查询默认值并重置
 */
const NEEDS_RESET_PROPERTIES = new Set([
  'checked',
  'selected',
  'disabled',
  'readOnly',
  'multiple',
  'autofocus',
  'required',
  'hidden',
  'value',
  'defaultValue',
  'placeholder',
  'tabIndex',
  'contentEditable',
  'draggable',
  'spellcheck',
  'autocomplete',
  'autocapitalize',
  'autocorrect',
  'dir',
  'lang',
  'title',
  'name',
  'type',
  'src',
  'href',
  'rel',
  'target',
  'alt',
  'width',
  'height',
  'id',
  'accessKey',
  'className',
  'min',
  'max',
  'step',
  'pattern',
  'accept',
  'action',
  'method',
  'enctype',
  'cols',
  'rows',
  'wrap',
  'colSpan',
  'rowSpan',
  'span',
  'start',
  'reversed',
  'async',
  'defer',
  'crossOrigin',
  'integrity',
  'nonce',
  'referrerPolicy',
  'loading',
  'decoding',
  'playsInline',
  'controls',
  'autoplay',
  'loop',
  'muted',
  'preload',
  'poster',
  'currentTime',
  'playbackRate',
  'volume',
  'defaultPlaybackRate',
  'defaultMuted',
  'kind',
  'srclang',
  'label',
  'default'
])

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
      el = document.createElementNS(SVG_NAMESPACE, tag)
    } else {
      el = document.createElement(tag)
    }
    return el as HostElement<T>
  }
  /** @inheritDoc */
  createFragment(view: FragmentView | ListView): HostFragment {
    const el = document.createDocumentFragment() as HostFragment
    const type = isFragmentView(view) ? 'Fragment' : 'List'
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
      if (child.parentNode === endAnchor.parentNode) return
      endAnchor.parentNode!.insertBefore(child, endAnchor)
    } else {
      if (child.parentNode === parent) return
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
    if (!parent) return
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
    if (!parent) return
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
    if (__EXCLUDE_PROP_NAMES__.includes(name)) {
      return
    }
    try {
      if (nextValue == null || nextValue === false) {
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
        el.setAttribute(name, nextValue)
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
          this.setClass(el, nextValue)
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
      el.setAttribute(name, nextValue === true ? '' : String(nextValue))
    } catch (error) {
      console.error(`[DOMRenderer.setAttribute] error setting attribute "${name}"`, error, el)
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
  /**
   * 移除元素属性
   *
   * 性能优化策略：
   * 1. 特殊属性（class/style/事件）快速路径处理
   * 2. 按需重置：只有需要重置的属性才会查询默认值
   *    - prevValue === undefined：属性从未设置，直接移除
   *    - 属性不在 NEEDS_RESET_PROPERTIES 中：直接移除
   *    - 属性在集合中：查询默认值并重置
   *
   * @param el - 目标元素
   * @param key - 属性名
   * @param prevValue - 之前的属性值，用于判断是否需要重置
   */
  private removeAttribute(el: HostElement, key: string, prevValue?: any): void {
    if (key === 'class' || key === 'className' || key === 'classname') {
      el.removeAttribute('class')
      return
    }
    if (key === 'style') {
      el.removeAttribute('style')
      return
    }
    if (typeof prevValue === 'function' && key.startsWith('on')) {
      this.removeEventListener(el, key, prevValue)
      return
    }
    if (key in el) {
      if (prevValue === undefined || !NEEDS_RESET_PROPERTIES.has(key)) {
        el.removeAttribute(key)
        return
      }
      try {
        const defaultValue = this.getDefaultValue(el.tagName.toLowerCase(), key)
        if (defaultValue !== undefined) {
          ;(el as unknown as Record<string, any>)[key] = defaultValue
        } else {
          el.removeAttribute(key)
        }
      } catch {
        el.removeAttribute(key)
      }
    } else {
      el.removeAttribute(key)
    }
  }
  private trySetDirectProperty<T extends Element>(el: T, name: string, value: any): boolean {
    if (!(name in el)) return false
    try {
      el[name as keyof T] = value
      return true
    } catch {
      return false
    }
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
        if (el.$view.isMounted) {
          // 递归恢复片段节点
          for (const child of children) {
            if (child.node) {
              el.appendChild(this.recoveryFragmentChildren(child.node))
            }
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
   * 获取指定标签的属性默认值
   *
   * 查找优先级（性能从高到低）：
   * 1. PREDEFINED_DEFAULTS 预定义表 - 直接返回，无需创建元素
   * 2. DEFAULT_PROPERTIES_CACHE 缓存 - 按标签名+属性名缓存
   * 3. 动态创建元素获取 - 最后手段，仅对未缓存的属性执行
   *
   * 注意：Map.set() 返回的是 Map 本身，不是设置的值，
   * 因此需要先创建缓存对象，再设置到 Map 中。
   *
   * @param tag - 标签名（如 'input', 'div'）
   * @param prop - 属性名
   * @returns 属性的默认值，仅返回 boolean/number/string 类型，其他返回 undefined
   */
  private getDefaultValue(tag: string, prop: string): any {
    if (prop in PREDEFINED_DEFAULTS) {
      return PREDEFINED_DEFAULTS[prop]
    }
    tag = tag.toLowerCase()
    let tagCache = DEFAULT_PROPERTIES_CACHE.get(tag)
    if (!tagCache) {
      tagCache = Object.create(null) as Record<string, any>
      DEFAULT_PROPERTIES_CACHE.set(tag, tagCache)
    }
    if (prop in tagCache) {
      return tagCache[prop]
    }
    try {
      const el = document.createElement(tag)
      const value = (el as any)[prop]
      if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
        tagCache[prop] = value
        return value
      }
      tagCache[prop] = undefined
      return undefined
    } catch {
      tagCache[prop] = undefined
      return undefined
    }
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
