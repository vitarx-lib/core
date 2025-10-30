import type { HTMLElementProps } from './attributes.js'

/**
 * 元素标签映射类型
 */
export type HTMLElementTagMap = HTMLElementTagNameMap &
  Pick<SVGElementTagNameMap, Exclude<keyof SVGElementTagNameMap, keyof HTMLElementTagNameMap>>
/**
 * 固有的元素标签名
 *
 * 包含了所有HTML元素标签名，如div、span、a等元素
 */
type HTMLElementTags = keyof HTMLElementTagMap
/**
 * 无子节点的元素标签映射类型
 */
export interface HTMLVoidElementMap {
  area: HTMLAreaElement
  base: HTMLBaseElement
  br: HTMLBRElement
  col: HTMLTableColElement
  embed: HTMLEmbedElement
  hr: HTMLHRElement
  img: HTMLImageElement
  input: HTMLInputElement
  link: HTMLLinkElement
  meta: HTMLMetaElement
  source: HTMLSourceElement
  track: HTMLTrackElement
  wbr: HTMLElement
}
/**
 * 无子节点的元素标签
 */
type VoidElementTags = keyof HTMLVoidElementMap
/**
 * ## 固有元素节点映射，用于 jsx ide 提示
 *
 * Vitarx 在解析元素属性时遵循`W3C`标准语法，元素的属性和在html中编写是一致的，但有以下不同之处。
 *
 * 1. style 属性接受 `string | Record<string,string|0>`，最终都会转换为键值对对象。
 * 2. class|className 属性接受 `string | Array<string> | Record<string,boolean>`，最终都会转换成字符串数组。
 * 3. 绑定事件支持多种语法，事件名称不区分大小写，示例如下：
 *    - 小驼峰式语法，如onClick。（推荐）
 *    - `W3C`标准语法，如onclick。
 */
export type HTMLIntrinsicElement = {
  [K in HTMLElementTags]: K extends VoidElementTags
    ? Omit<HTMLElementProps<HTMLElementTagMap[K]>, 'children'> // 忽略 children 属性
    : HTMLElementProps<HTMLElementTagMap[K]>
}
