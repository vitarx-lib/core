import type { Properties as CssProperties } from 'csstype'
import { type RefEl, Vitarx } from './core/index.js'

export * from './core/index.js'
export * from './utils/index.js'

declare global {
  /** 任意函数 */
  type AnyFunction = (...args: any[]) => any
  /** 任意回调函数 */
  type AnyCallback = AnyFunction
  /** void 回调函数 */
  type VoidCallback = VoidFunction
  /** 任意对象 */
  type AnyRecord = Record<any, any>
  /** 任意数组 */
  type AnyArray = Array<any>
  /** 任意 Map */
  type AnyMap = Map<any, any>
  /** 任意 WeakMap */
  type AnyWeakMap = WeakMap<WeakKey, any>
  /** 任意 WeakSet */
  type AnyWeakSet = WeakSet<WeakKey>
  /** 任意 Set */
  type AnySet = Set<any>
  /** 任意集合对象 */
  type AnyCollection = AnyMap | AnyWeakMap | AnyWeakSet | AnySet
  /** 任意对象类型 函数除外 */
  type AnyObject = AnyRecord | AnyArray | AnyMap | AnySet | AnyWeakMap | AnyWeakSet
  /** 任意原始值类型 */
  type AnyPrimitive = null | undefined | boolean | number | string | bigint | symbol
  /** 深度只读 */
  type DeepReadonly<T> = T extends object
    ? {
        readonly [P in keyof T]: DeepReadonly<T[P]>
      }
    : Readonly<T>
  /** 深度可写 */
  type unDeepReadonly<T> =
    T extends Readonly<object>
      ? {
          [P in keyof T]: unDeepReadonly<T[P]>
        }
      : T
  /** 让接口的部分属性 为必填项 */
  type MakeRequired<T extends object, K extends keyof T> = T & {
    [P in K]-?: T[P] // 强制指定的属性 K 为必填
  }
  namespace JSX {
    /** 元素类型 */
    type Element = Vitarx.Element
    /** 类组件实例 */
    type ElementClass = Vitarx.ElementClass

    /** 固有元素 */
    interface IntrinsicElements extends HtmlIntrinsicElements {}

    /** 固有属性 */
    interface IntrinsicAttributes extends Vitarx.GlobalIntrinsicAttributes {}

    /** 子节点类型校验 */
    export interface ElementChildrenAttribute {
      children: {}
    }

    /** 类组件属性 */
    export interface IntrinsicClassAttributes<T> {
      ref?: RefEl<T>
    }
  }
}

/** HTML元素标签映射 */
export type HtmlElementTagMap = HTMLElementTagNameMap &
  Pick<SVGElementTagNameMap, Exclude<keyof SVGElementTagNameMap, keyof HTMLElementTagNameMap>>
/** HTML元素标签 */
export type HtmlElementTags = keyof HtmlElementTagMap
/**
 * ## HTML固有元素
 *
 * Vitarx在解析元素属性时遵循`W3C`标准语法，元素的属性和在html中编写是一致的，但有以下不同之处。
 *
 * 1. style属性接受对象和字符串，对象会自动转为字符串。
 * 2. class属性接受字符串、数组和对象，对象和字符串都会自动转为字符串。
 * 3. 绑定事件支持多种语法，事件名称不区分大小写，示例如下：
 *    - `W3C`标准语法，如onclick。
 *    - 小驼峰式语法，如onClick。
 */
export type HtmlIntrinsicElements = {
  [K in keyof HtmlElementTagMap]: HtmlProperties<HtmlElementTagMap[K]>
}

/**
 * 部分事件名转小驼峰命名
 *
 * @extends {@link GlobalEventHandlersEventMap}
 */
interface GlobalEventHandlersEventMap_HUMP {
  animationcancel: 'animationCancel'
  animationend: 'animationEnd'
  animationiteration: 'animationIteration'
  animationstart: 'animationStart'
  auxclick: 'auxClick'
  beforeinput: 'beforeInput'
  beforetoggle: 'beforeToggle'
  canplay: 'canPlay'
  canplaythrough: 'canPlayThrough'
  compositionend: 'compositionEnd'
  compositionstart: 'compositionStart'
  compositionupdate: 'compositionUpdate'
  contextlost: 'contextLost'
  contextmenu: 'contextMenu'
  contextrestored: 'contextRestored'
  cuechange: 'cueChange'
  dragend: 'dragEnd'
  dragenter: 'dragEnter'
  dragleave: 'dragLeave'
  dragover: 'dragOver'
  dragstart: 'dragStart'
  durationchange: 'durationChange'
  focusin: 'focusIn'
  focusout: 'focusOut'
  formdata: 'formData'
  gotpointercapture: 'gotPointerCapture'
  loadeddata: 'loadedData'
  loadedmetadata: 'loadedMetaData'
  loadstart: 'loadStart'
  lostpointercapture: 'lostPointerCapture'
  mousedown: 'mouseDown'
  mouseenter: 'mouseEnter'
  mouseleave: 'mouseLeave'
  mousemove: 'mouseMove'
  mouseout: 'mouseOut'
  mouseover: 'mouseOver'
  mouseup: 'mouseUp'
  pointercancel: 'pointerCancel'
  pointerdown: 'pointerDown'
  pointerenter: 'pointerEnter'
  pointerleave: 'pointerLeave'
  pointermove: 'pointerMove'
  pointerout: 'pointerOut'
  pointerover: 'pointerOver'
  pointerup: 'pointerUp'
  ratechange: 'rateChange'
  scrollend: 'scrollEnd'
  securitypolicyviolation: 'securityPolicyViolation'
  selectionchange: 'selectionChange'
  selectstart: 'selectStart'
  slotchange: 'slotChange'
  timeupdate: 'timeUpdate'
  touchcancel: 'touchCancel'
  touchend: 'touchEnd'
  touchmove: 'touchMove'
  touchstart: 'touchStart'
  transitioncancel: 'transitionCancel'
  transitionend: 'transitionEnd'
  transitionrun: 'transitionRun'
  transitionstart: 'transitionStart'
  volumechange: 'volumeChange'
  webkitanimationend: 'webkitAnimationEnd'
  webkitanimationiteration: 'webkitAnimationIteration'
  webkitanimationstart: 'webkitAnimationStart'
  webkittransitionend: 'webkitTransitionEnd'
}

// 匹配小驼峰命名 不存在时返回原始字符串
type ToHump<S extends string> = S extends keyof GlobalEventHandlersEventMap_HUMP
  ? GlobalEventHandlersEventMap_HUMP[S]
  : S
type EventName<K extends string> = `on${K}` | `on${Capitalize<ToHump<K>>}`

// 拓展事件名
export type OutreachEventName<T extends Record<string, any>> = {
  [K in keyof T as K extends `on${infer Rest}` ? EventName<Rest> : K]?: T[K]
}

type BoolType = 'true' | 'false' | boolean

/**
 * AutoComplete的可选值列表，只预设了部分值
 *
 * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/autocomplete 具体请看文档
 */
type AutoComplete =
  | 'off'
  | 'on'
  | 'email'
  | 'username'
  | 'new-password'
  | 'current-password'
  | 'one-time-code'
  | 'organization-title'
  | 'organization'
  | 'street-address'
  | 'country'
  | 'sex'
  | 'url'
  | 'photo'
  | 'language'
  | 'bday'
  | 'bday-day'
  | string

// HTML元素class属性类型
export type HTMLClassProperties = string | string[] | Record<string, boolean>

/**
 * 自定义数据属性
 */
export interface CustomProperties {
  /**
   * 全局属性`class`接受字符串、数组和`Record<string, boolean>`类型的对象。
   *
   * 当为对象时`Key`为类名，`Value`为是否添加该类名的布尔值。
   *
   * ```jsx
   * // 对象类型
   * <div class={{ active: true, hidden: false,'my-class': true }}></div>
   * // 数组类型
   * <div class={['active', 'my-class']}></div>
   * // `W3C`标准语法
   * <div class="active my-class"></div>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/class 详细文档
   */
  class?: HTMLClassProperties
  children?: Vitarx.Children

  [key: string]: any
}

/**
 * 局部属性
 */
interface PartProperties {
  accept?: string
  autocomplete?: AutoComplete
  capture?: 'user' | 'environment'
  crossorigin?: 'anonymous' | 'use-credentials' | string
  dirname?: string
  disabled?: boolean
  elementTiming?: string
  for?: string
  max?: string | number
  maxlength?: number | string
  min?: string | number
  multiple?: boolean
  pattern?: string
  placeholder?: string
  readonly?: boolean
  rel?: string
  required?: boolean
  size?: number | string
  step?: number | string
}

// 样式属性
export type HTMLStyleProperties = string | CssProperties | Partial<CSSStyleDeclaration>

/**
 * 全局属性
 */
export interface OverwriteHtmlProperties extends PartProperties {
  /**
   * 全局属性 `style` 包含应用到元素的 CSS 样式声明。
   * 要注意样式最好定义在单独的文件中。
   * 这个属性以及 `<style>` 元素的主要目的是快速装饰。例如用于测试目的。
   *
   * > **备注**：这个属性不能用于传递语义信息。即使所有样式都移除了，页面也应该保留正确语义。
   * 通常它不应用于隐藏不相关的信息；这应该使用 `hidden` 属性来实现。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/style 完整的使用文档
   */
  style?: string | CssProperties | Partial<CSSStyleDeclaration>
  accesskey?: string
  anchor?: string
  autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters'
  autofocus?: boolean
  contentEditable?: BoolType | 'plaintext-only'
  dir?: 'auto' | 'ltr' | 'rtl'
  draggable?: BoolType
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send'
  hidden?: '' | 'hidden' | 'until-found'
  id?: string
  inert?: boolean
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  is?: string
  itemId?: string
  itemProp?: string
  itemRef?: string
  itemScope?: string
  itemType?: string
  lang?: string
  nonce?: string
  part?: string
  popover?: 'auto' | 'manual'
  slot?: string
  spellcheck?: BoolType | ''
  tabIndex?: string | number
  title?: string
  translate?: 'yes' | 'no'
  virtualkeyboardpolicy?: 'auto' | 'manual'
  writingsuggestions?: BoolType
  exportparts?: string
}

/**
 * 从W3C文档中提取到的合法标签属性，用于生成类型
 *
 * `data-*` 需要单独定义，因为 `data-*` 是自定义属性，不是 W3C 规范中的属性。
 *
 * 包含了所有html标签可以直接赋值的属性，以及所有合法的事件属性。
 *
 * @see https://www.w3schools.com/tags/ref_standardattributes.asp
 */
type PropertyNames =
  | 'className'
  | 'accept'
  | 'accept-charset'
  | 'acceptCharset'
  | 'accesskey'
  | 'action'
  | 'align'
  | 'alt'
  | 'async'
  | 'autocomplete'
  | 'autofocus'
  | 'autoplay'
  | 'bgcolor'
  | 'border'
  | 'charset'
  | 'checked'
  | 'cite'
  | 'class'
  | 'color'
  | 'cols'
  | 'colspan'
  | 'content'
  | 'contenteditable'
  | 'controls'
  | 'coords'
  | 'data'
  | 'datetime'
  | 'default'
  | 'defer'
  | 'dir'
  | 'dirname'
  | 'disabled'
  | 'download'
  | 'draggable'
  | 'enctype'
  | 'enterkeyhint'
  | 'for'
  | 'form'
  | 'formaction'
  | 'headers'
  | 'height'
  | 'hidden'
  | 'high'
  | 'href'
  | 'hreflang'
  | 'http-equiv'
  | 'id'
  | 'inert'
  | 'inputmode'
  | 'ismap'
  | 'kind'
  | 'label'
  | 'lang'
  | 'list'
  | 'loop'
  | 'low'
  | 'max'
  | 'maxlength'
  | 'media'
  | 'method'
  | 'min'
  | 'multiple'
  | 'muted'
  | 'name'
  | 'novalidate'
  | 'onabort'
  | 'onafterprint'
  | 'onbeforeprint'
  | 'onbeforeunload'
  | 'onblur'
  | 'oncanplay'
  | 'oncanplaythrough'
  | 'onchange'
  | 'onclick'
  | 'oncontextmenu'
  | 'oncopy'
  | 'oncuechange'
  | 'oncut'
  | 'ondblclick'
  | 'ondrag'
  | 'ondragend'
  | 'ondragenter'
  | 'ondragleave'
  | 'ondragover'
  | 'ondragstart'
  | 'ondrop'
  | 'ondurationchange'
  | 'onemptied'
  | 'onended'
  | 'onerror'
  | 'onfocus'
  | 'onhashchange'
  | 'oninput'
  | 'oninvalid'
  | 'onkeydown'
  | 'onkeypress'
  | 'onkeyup'
  | 'onload'
  | 'onloadeddata'
  | 'onloadedmetadata'
  | 'onloadstart'
  | 'onmousedown'
  | 'onmousemove'
  | 'onmouseout'
  | 'onmouseover'
  | 'onmouseup'
  | 'onmousewheel'
  | 'onoffline'
  | 'ononline'
  | 'onpagehide'
  | 'onpageshow'
  | 'onpaste'
  | 'onpause'
  | 'onplay'
  | 'onplaying'
  | 'onpopstate'
  | 'onprogress'
  | 'onratechange'
  | 'onreset'
  | 'onresize'
  | 'onscroll'
  | 'onsearch'
  | 'onseeked'
  | 'onseeking'
  | 'onselect'
  | 'onstalled'
  | 'onstorage'
  | 'onsubmit'
  | 'onsuspend'
  | 'ontimeupdate'
  | 'ontoggle'
  | 'onunload'
  | 'onvolumechange'
  | 'onwaiting'
  | 'onwheel'
  | 'open'
  | 'optimum'
  | 'pattern'
  | 'placeholder'
  | 'popover'
  | 'popovertarget'
  | 'popovertargetaction'
  | 'poster'
  | 'preload'
  | 'readonly'
  | 'rel'
  | 'required'
  | 'reversed'
  | 'rows'
  | 'rowspan'
  | 'sandbox'
  | 'scope'
  | 'selected'
  | 'shape'
  | 'size'
  | 'sizes'
  | 'span'
  | 'spellcheck'
  | 'src'
  | 'srcdoc'
  | 'srclang'
  | 'srcset'
  | 'start'
  | 'step'
  | 'style'
  | 'tabindex'
  | 'target'
  | 'title'
  | 'translate'
  | 'type'
  | 'usemap'
  | 'value'
  | 'width'
  | 'wrap'

// 判断一个属性P是否存在于W3C标准属性中
type IsW3CHtmlProperties<P> = P extends string
  ? Lowercase<P> extends Lowercase<PropertyNames>
    ? P
    : never
  : never
/**
 * 从对象接口中提取出符合W3C标准的属性，并返回一个新对象接口。
 *
 * @template T 要提取的对象接口
 * @template M 要合并的对象接口，如果T属性存在于M中，则使用M中的类型。
 * @template E 要排除的属性名，例如 'style'|'class'
 *
 * @example
 * type DivProps = ExtractW3CHtmlProperties<HTMLDivElement,CustomProperties, 'style'>
 *
 * @returns {ExtractW3CHtmlProperties<T, E>} 一个新对象接口，其中只包含符合W3C标准的属性。
 */
type ExtractW3CHtmlProperties<
  T extends Element,
  M extends object = OverwriteHtmlProperties,
  E extends string = never
> = {
  [K in keyof T as K extends E
    ? never
    : K extends keyof M
      ? K
      : IsW3CHtmlProperties<K>]: K extends keyof M ? M[K] : T[K]
}

/** 将接口的所有键转换为小写 */
type ToLowerCaseKeys<T extends Record<string, any>> = {
  [K in keyof T as K extends string ? Lowercase<K> : K]: T[K]
}
/** 将接口转换为可选属性 */
type ToPartialProperties<
  T extends Element,
  M extends object = OverwriteHtmlProperties,
  E extends string = never
> = Partial<ExtractW3CHtmlProperties<T, M, E>>

/** 生成HTML标签可选属性，包括事件和自定义数据属性 */
export type HtmlProperties<
  T extends Element,
  M extends object = OverwriteHtmlProperties,
  E extends string = never
> = ToPartialProperties<T, M, E> &
  OutreachEventName<ToLowerCaseKeys<ToPartialProperties<T, M, E>>> &
  CustomProperties &
  Vitarx.GlobalIntrinsicAttributes
