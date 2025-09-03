import type { RefSignal } from '@vitarx/responsive'
import type { Comment as CommentType, Fragment, Text as TextType } from '../constant.js'
import { FragmentVNode } from '../nodes/index.js'
import type { ElementProperties } from './properties.js'
import type { Child, VNodeType } from './vnode.js'

/**
 * 元素标签映射类型
 */
type ElementTagMap = HTMLElementTagNameMap &
  Pick<SVGElementTagNameMap, Exclude<keyof SVGElementTagNameMap, keyof HTMLElementTagNameMap>>
/**
 * 文本节点元素名称
 */
export type TextNodeElementName = 'text-node'
/**
 * 注释节点元素名称
 */
export type CommentNodeElementName = 'comment-node'
/**
 * 无标签元素名称
 */
export type NoTagNodeElementName = TextNodeElementName | CommentNodeElementName
/**
 * 片段节点元素名称
 */
export type FragmentNodeElementName = 'fragment-node'
/**
 * 固有的元素标签名
 *
 * 包含了所有HTML元素标签名，如div、span、a等元素
 */
export type IntrinsicNodeElementName = keyof ElementTagMap
/**
 * 特殊元素
 */
export type SpecialNodeElementName = NoTagNodeElementName | FragmentNodeElementName
/**
 * 所有元素
 *
 * 包含了所有元素，如div、span、a等元素，以及特殊元素如注释节点、文本节点、片段节点等
 */
export type AllNodeElementName = IntrinsicNodeElementName | SpecialNodeElementName
/**
 * 特殊元素节点映射
 */
export type SpecialNodeElement = {
  [K in SpecialNodeElementName]: {
    children: K extends NoTagNodeElementName ? string | RefSignal<string> : Child[]
  }
}
/**
 * ## 固有元素节点映射，用于 jsx ide 提示
 *
 * Vitarx 在解析元素属性时遵循`W3C`标准语法，元素的属性和在html中编写是一致的，但有以下不同之处。
 *
 * 1. style属性接受对象和字符串，对象会自动转为字符串。
 * 2. class属性接受字符串、数组和对象，对象和数组都会自动转为字符串。
 * 3. 绑定事件支持多种语法，事件名称不区分大小写，示例如下：
 *    - `W3C`标准语法，如onclick。
 *    - 小驼峰式语法，如onClick。
 */
export type IntrinsicNodeElement = {
  [K in IntrinsicNodeElementName]: ElementProperties<ElementTagMap[K]>
}
export type AnyNodeElement = IntrinsicNodeElement & SpecialNodeElement
export type NodeElement<T extends AllNodeElementName = AllNodeElementName> = AnyNodeElement[T]

/**
 * 片段元素接口
 */
export interface FragmentElement extends DocumentFragment {
  readonly $vnode: FragmentVNode
}

/**
 * 所有可能的运行时元素
 */
export type AnyElement = ElementTagMap[keyof ElementTagMap] | FragmentElement | Comment | Text

/**
 * 运行时元素接口
 *
 * 根据元素标签推导出元素类型
 *
 * @template T - 元素标签
 */
export type RuntimeElement<T extends VNodeType = VNodeType> = T extends
  | CommentNodeElementName
  | CommentType
  ? Comment
  : T extends TextNodeElementName | TextType
    ? Text
    : T extends FragmentNodeElementName | Fragment
      ? FragmentElement
      : T extends IntrinsicNodeElementName
        ? ElementTagMap[T]
        : AnyElement
