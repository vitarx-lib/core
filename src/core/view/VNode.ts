import {
  type HtmlElementTagMap,
  type HtmlElementTags,
  type HtmlIntrinsicElements,
  isRecordObject,
  popProperty,
  Scope
} from '../../index.js'
import { type ClassWidget } from './widget.js'
import type { FnWidget } from './fn-widget.js'

/** 片段组件标识符 */
export const Fragment: unique symbol = Symbol('Fragment')
const RefElSymbol = Symbol('RefEl')
/** 片段类型标识符 */
export type FragmentTag = typeof Fragment
/** 虚拟节点标识符 */
const VNodeSymbol = Symbol('VNode')
/** 唯一标识符 */
export type OnlyKey = string | number | bigint
// 计算出元素类型
type ComputedRefElType<T> = T extends HtmlElementTags ? HtmlElementTagMap[T] : T extends FragmentTag ? VDocumentFragment : T extends FnWidget ? Record<string, any> : T
/** 引用元素类型 */
export type RefEl<T> = {
  value: ComputedRefElType<T> | null, readonly [RefElSymbol]: true
}
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
  ref?: RefEl<any>
}

/**
 * HTML 节点类型
 */
export type HtmlTagName = HtmlElementTags
// 节点类型
export type VNodeType = HtmlTagName | FragmentTag | ClassWidget | FnWidget
// 节点属性结构
export type VNodeProps<T> = (T extends HtmlElementTags
  ? HtmlIntrinsicElements[T]
  : T extends ClassWidget<infer P>
    ? P
    : T extends FnWidget<infer P>
      ? P
      : {}) &
  IntrinsicAttributes

/** 子节点类型 */
export type VNodeChild = string | VNode | Array<VNode | string>
/** HTML片段节点数组 */
export type VDocumentFragment = Array<Element | Text>
/** 真实元素对象，片段节点为数组 */
export type VElement = Element | VDocumentFragment

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
  ref: RefEl<any> | null
  el: VElement | null
  scope: Scope | null
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
  if (!isRecordObject(props)) {
    throw new TypeError(
      `[Vitarx]：createVNode.props参数类型必须是一个键值对对象，给定${typeof props}`
    )
  }
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
    el: null,
    scope: null
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
 * 引用元素
 *
 * 会在widget或元素真实挂载到dom后自动赋值给该对象
 */
export function refEl<T>(): RefEl<T> {
  return {
    value: null,
    [RefElSymbol]: true
  }
}

/**
 * 判断是否为引用元素
 *
 * @param obj
 */
export function isRefEl(obj: any): obj is RefEl<any> {
  return obj?.[RefElSymbol] === true
}
