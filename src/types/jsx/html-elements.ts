import { HtmlProperties } from './html-properties'

export type HtmlElementTagMap = HTMLElementTagNameMap &
  Pick<SVGElementTagNameMap, Exclude<keyof SVGElementTagNameMap, keyof HTMLElementTagNameMap>>

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
