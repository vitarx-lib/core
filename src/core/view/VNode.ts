import {
  type HtmlElementTagMap,
  type HtmlElementTags,
  type HtmlIntrinsicElements,
  isArray,
  isFunction,
  isRecordObject,
  popProperty,
  Scope,
  type WidgetChildren
} from '../../index.js'
import { type ClassWidget } from './widget.js'
import type { FnWidget } from './fn-widget.js'
import type { ExcludeLifeCycleMethods } from './life-cycle.js'

/** 响应式元素引用标记 */
const RefElSymbol = Symbol('RefEl')
/** 文本节点标识符 */
const TextVNodeSymbol = Symbol('TextNode')
/** 片段组件标识符 */
export const Fragment: unique symbol = Symbol('Fragment')
/** 片段类型标识符 */
export type Fragment = typeof Fragment
/** 虚拟节点标识符 */
const VNodeSymbol = Symbol('VNode')

/** 文本节点 */
export interface TextVNode {
  value: string
  el: Text | null
  [TextVNodeSymbol]: true
}
/** 唯一标识符 */
export type OnlyKey = string | number | bigint
// 辅助计算出元素类型
type ComputedRefElType<T> = T extends HtmlElementTags
  ? HtmlElementTagMap[T]
  : T extends Fragment
    ? VDocumentFragment
    : T extends FnWidget
      ? Record<string, any>
      : ExcludeLifeCycleMethods<T>
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
export type VNodeType = HtmlTagName | Fragment | Text | ClassWidget | FnWidget
// 节点属性结构
export type VNodeProps<T> = (T extends HtmlElementTags
  ? HtmlIntrinsicElements[T]
  : T extends ClassWidget<infer P>
    ? P
    : T extends FnWidget<infer P>
      ? P
      : {}) &
  IntrinsicAttributes
// createVNode.children参数类型
type Children = (VNodeChild | string) | (VNodeChild | string)[]
// 辅助计算出Children类型
type ComputedVNodeChildren<T> = T extends HtmlElementTags
  ? Children
  : T extends Fragment
    ? Children
    : WidgetChildren<VNodeProps<T>>
/** 子节点类型 */
export type VNodeChild = VNode | TextVNode
/** 子节点列表 */
export type VNodeChildren = Array<VNodeChild>
/** HTML片段节点数组 */
export type VDocumentFragment = Array<Element | Text>
/** 真实元素对象，片段节点为数组 */
export type VElement = Element | Text | VDocumentFragment
/**
 * 虚拟Node
 *
 * - `type`: 节点类型
 * - `props`: 节点属性
 * - `key`: 节点唯一标识
 * - `ref`: 节点引用
 * - `scope`: 作用域，内部创建，用于管理副作用
 * - `children`: 子节点列表，如果是函数小部件或类小部件，则此参数会覆盖到`props.children`
 */
export interface VNode<T extends VNodeType = VNodeType> {
  type: T
  props: VNodeProps<T>
  key: OnlyKey | null
  ref: RefEl<T> | null
  el: VElement | null
  scope: Scope | null
  children: VNodeChildren | undefined
  [VNodeSymbol]: true
}
/**
 * 创建虚拟节点
 *
 * @param type - 节点类型
 * @param props - 节点属性
 * @param children - 子节点，如果是小部件类型则会写入到 `props.children`
 * @returns {VNode} - 虚拟节点
 */
export function createVNode<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> & IntrinsicAttributes,
  children?: ComputedVNodeChildren<T>
): VNode<T> {
  if (!props) {
    // @ts-ignore
    props = {}
  } else if (!isRecordObject(props)) {
    throw new TypeError(
      `[Vitarx]：createVNode.props参数类型必须是Record(string,any)类型，给定${typeof props}`
    )
  }
  if (isFunction(type)) {
    if (children !== undefined) {
      // @ts-ignore
      props.children = children
      children = undefined
    }
  }
  // 如果不是函数，则将children转为数组，方便后续处理
  else {
    const c = popProperty(props as any, 'children')
    children = children || c
    if (children) {
      if (!isArray(children)) {
        // @ts-ignore
        children = [children]
      }
      children.forEach((child, i) => {
        if (!isVNode(child)) {
          // @ts-ignore
          children[i] = {
            value: String(child),
            el: null,
            [TextVNodeSymbol]: true
          }
        }
      })
    }
  }
  // 取出唯一标识符
  const key = popProperty(props, 'key') || null
  // 引用元素
  const ref = popProperty(props, 'ref') || null
  return {
    [VNodeSymbol]: true,
    type,
    props,
    children: children as VNodeChildren,
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
 * 判断是否为文本节点
 *
 * @param obj
 */
export function isTextVNode(obj: any): obj is TextVNode {
  return obj?.[TextVNodeSymbol] === true
}
/**
 * 引用元素
 *
 * 会在widget或元素挂载到dom后自动赋值给该value
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

