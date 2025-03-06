import type { HTMLProperties } from './properties.js'

export type * from './properties.js'

/** HTML元素标签映射 */
export type HTMLElementTagMap = HTMLElementTagNameMap &
  Pick<SVGElementTagNameMap, Exclude<keyof SVGElementTagNameMap, keyof HTMLElementTagNameMap>>

/** HTML固有的元素标签 */
export type HTMLIntrinsicTags = keyof HTMLElementTagMap

/**
 * ## HTML固有元素
 *
 * Vitarx在解析元素属性时遵循`W3C`标准语法，元素的属性和在html中编写是一致的，但有以下不同之处。
 *
 * 1. style属性接受对象和字符串，对象会自动转为字符串。
 * 2. class属性接受字符串、数组和对象，对象和数组都会自动转为字符串。
 * 3. 绑定事件支持多种语法，事件名称不区分大小写，示例如下：
 *    - `W3C`标准语法，如onclick。
 *    - 小驼峰式语法，如onClick。
 */
export type HTMLIntrinsicElements = {
  [K in keyof HTMLElementTagMap]: HTMLProperties<HTMLElementTagMap[K]>
}

/**
 * 片段节点
 */
export interface VDocumentFragment extends DocumentFragment {
  /**
   * 空节点占位元素
   */
  __emptyElement?: Text | Comment
  /**
   * 获取第一个子节点
   */
  __firstChild: () => HtmlElement
  /**
   * 获取最后一个子元素
   */
  __lastChild: () => HtmlElement
  /**
   * 删除整个片段节点
   */
  __remove: () => void
  /**
   * 恢复片段节点
   */
  __recovery: () => VDocumentFragment
}

/**
 * 渲染器创建的元素
 */
export type HtmlElement = Element | VDocumentFragment | Text | Comment

/**
 * 可作为容器的元素类型
 */
export type ContainerElement = Element | VDocumentFragment
