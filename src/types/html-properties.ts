import { CustomProperties, OverwriteHtmlProperties } from './html-global-properties'
import { OutreachEventName } from './html-event'

// 任意对象
type AnyObject = Record<any, any>

/**
 * 从W3C文档中提取到的合法标签属性，用于生成类型
 *
 * `data-*` 需要单独定义，因为 `data-*` 是自定义属性，不是 W3C 规范中的属性。
 *
 * 包含了所有html标签可以直接赋值的属性，以及所有合法的事件属性。
 *
 * @see https://www.w3schools.com/tags/ref_standardattributes.asp
 */
const PropNames = [
  'className',
  'accept',
  'accept-charset',
  'acceptCharset',
  'accesskey',
  'action',
  'align',
  'alt',
  'async',
  'autocomplete',
  'autofocus',
  'autoplay',
  'bgcolor',
  'border',
  'charset',
  'checked',
  'cite',
  'class',
  'color',
  'cols',
  'colspan',
  'content',
  'contenteditable',
  'controls',
  'coords',
  'data',
  'datetime',
  'default',
  'defer',
  'dir',
  'dirname',
  'disabled',
  'download',
  'draggable',
  'enctype',
  'enterkeyhint',
  'for',
  'form',
  'formaction',
  'headers',
  'height',
  'hidden',
  'high',
  'href',
  'hreflang',
  'http-equiv',
  'id',
  'inert',
  'inputmode',
  'ismap',
  'kind',
  'label',
  'lang',
  'list',
  'loop',
  'low',
  'max',
  'maxlength',
  'media',
  'method',
  'min',
  'multiple',
  'muted',
  'name',
  'novalidate',
  'onabort',
  'onafterprint',
  'onbeforeprint',
  'onbeforeunload',
  'onblur',
  'oncanplay',
  'oncanplaythrough',
  'onchange',
  'onclick',
  'oncontextmenu',
  'oncopy',
  'oncuechange',
  'oncut',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onemptied',
  'onended',
  'onerror',
  'onfocus',
  'onhashchange',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onload',
  'onloadeddata',
  'onloadedmetadata',
  'onloadstart',
  'onmousedown',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onmousewheel',
  'onoffline',
  'ononline',
  'onpagehide',
  'onpageshow',
  'onpaste',
  'onpause',
  'onplay',
  'onplaying',
  'onpopstate',
  'onprogress',
  'onratechange',
  'onreset',
  'onresize',
  'onscroll',
  'onsearch',
  'onseeked',
  'onseeking',
  'onselect',
  'onstalled',
  'onstorage',
  'onsubmit',
  'onsuspend',
  'ontimeupdate',
  'ontoggle',
  'onunload',
  'onvolumechange',
  'onwaiting',
  'onwheel',
  'open',
  'optimum',
  'pattern',
  'placeholder',
  'popover',
  'popovertarget',
  'popovertargetaction',
  'poster',
  'preload',
  'readonly',
  'rel',
  'required',
  'reversed',
  'rows',
  'rowspan',
  'sandbox',
  'scope',
  'selected',
  'shape',
  'size',
  'sizes',
  'span',
  'spellcheck',
  'src',
  'srcdoc',
  'srclang',
  'srcset',
  'start',
  'step',
  'style',
  'tabindex',
  'target',
  'title',
  'translate',
  'type',
  'usemap',
  'value',
  'width',
  'wrap'
] as const

// PropertyNames是联合类型，其中每个元素都是字符串，并且是 PropNames 数组中的元素，表示所有符合W3C标准的属性。
type PropertyNames = (typeof PropNames)[number]

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
  M extends AnyObject = OverwriteHtmlProperties,
  E extends string = never
> = {
  [K in keyof T as K extends E
    ? never
    : K extends keyof M
      ? K
      : IsW3CHtmlProperties<K>]: K extends keyof M ? M[K] : T[K]
}

// 将接口的所有键转换为小写
type ToLowerCaseKeys<T extends Record<string, any>> = {
  [K in keyof T as K extends string ? Lowercase<K> : K]: T[K]
}
// 将接口转换为可选属性
type ToPartialProperties<
  T extends Element,
  M extends AnyObject = OverwriteHtmlProperties,
  E extends string = never
> = Partial<ExtractW3CHtmlProperties<T, M, E>>

// 生成HTML标签可选属性，包括事件和自定义数据属性
export type GenerateProperties<
  T extends Element,
  M extends AnyObject = OverwriteHtmlProperties,
  E extends string = never
> = ToPartialProperties<T, M, E> &
  OutreachEventName<ToLowerCaseKeys<ToPartialProperties<T, M, E>>> &
  CustomProperties
