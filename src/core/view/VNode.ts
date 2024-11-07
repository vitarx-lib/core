import {
  type HtmlElementTags,
  type HtmlIntrinsicElements,
  isArray,
  popProperty,
  Ref
} from '../../index.js'
import { type WidgetConstructor } from './widget.js'
import type { FnWidget } from './fn-widget.js'
// 片段组件标识符
export const Fragment: unique symbol = Symbol('Fragment')
// 虚拟节点标识符
const VNodeSymbol = Symbol('VNode')
// 唯一标识符
export type OnlyKey = string | number | bigint

/**
 * 全局属性
 */
export interface IntrinsicAttributes {
  /**
   * 控制一个 `Component` 如何替换树中的另一个 `Component`。
   *
   * 在运行时，如果两个Component的`key`相同，则会更新已渲染的Component，否则会移除旧Component，然后插入新Component。
   *
   * 这在某些情况下很有用，例如，当您想重新排序列表时。
   *
   * 通常，作为另一个 Component 的唯一子项的 Component 不需要显式键。
   */
  key?: OnlyKey
  /**
   * 引用组件
   */
  ref?: Ref
}

/**
 * HTML 节点类型
 */
export type HtmlVNodeType = HtmlElementTags
// 节点类型
export type VNodeType =
  | HtmlVNodeType
  | typeof Fragment
  | WidgetConstructor<Record<string, any>>
  | FnWidget
// 节点属性结构
type VNodeProps<T> = T extends HtmlElementTags
  ? HtmlIntrinsicElements[T]
  : T extends WidgetConstructor<infer P>
    ? P
    : T extends FnWidget<infer P>
      ? P
      : never

// 子节点类型
export type VNodeChild = string | VNode | Array<VNode | string>
// HTML 节点数组
export type VDocumentFragment = Array<Element | Text>
export type VElement = HTMLElement | VDocumentFragment

/**
 * 虚拟Node
 *
 * - `type`: 节点类型
 * - `props`: 节点属性
 */
export interface VNode<T extends VNodeType = VNodeType> {
  type: T
  props: VNodeProps<T>
  children: VNodeChild | undefined
  key: OnlyKey | null
  ref: Ref | null
  el: VElement | null
  [VNodeSymbol]: true
}

/**
 * 创建虚拟节点
 *
 * @param type - 节点类型
 * @param props - 节点属性
 */
export function createVNode<T extends VNodeType>(
  type: T,
  props: IntrinsicAttributes & VNodeProps<T>
): VNode<T> {
  const key = popProperty(props, 'key') || null
  const ref = popProperty(props, 'ref') || null
  const children = popProperty(props as any, 'children')
  return {
    [VNodeSymbol]: true,
    type,
    props,
    children,
    key,
    ref,
    el: null
  }
}

/**
 * 判断是否为虚拟节点对象
 *
 * @param obj
 */
export function isVNode(obj: any): obj is VNode {
  return obj?.[VNodeSymbol] === true
}

/**
 * node数组转换为片段
 *
 * @param nodes
 */
export function nodesToFragment(nodes: VDocumentFragment): DocumentFragment {
  const el = document.createDocumentFragment()
  for (let i = 0; i < nodes.length; i++) {
    el.appendChild(nodes[i])
  }
  return el
}

/**
 * 片段转node数组
 *
 * @param el
 */
export function fragmentToNodes(el: DocumentFragment): VDocumentFragment {
  const els: Node[] = []
  for (let i = 0; i < el.childNodes.length; i++) {
    els.push(el.childNodes[i])
  }
  return els as VDocumentFragment
}

/**
 * VElement 转 HTMLElement
 *
 * @param el
 * @constructor
 */
export function VElementToHTMLElement(el: VElement) {
  return isArray(el) ? nodesToFragment(el) : el
}
