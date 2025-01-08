// noinspection JSUnusedGlobalSymbols

import type {
  HtmlElementTagMap,
  HtmlIntrinsicElements,
  HTMLIntrinsicTags,
  VDocumentFragment
} from '../renderer/web-runtime-dom/index.js'
import type { ExcludeWidgetIntrinsicKeywords } from '../widget/constant.js'
import {
  type ClassWidgetConstructor,
  type FnWidgetConstructor,
  isClassWidgetConstructor,
  Widget
} from '../widget/index.js'
import {
  CommentVNodeSymbol,
  Fragment,
  RefElSymbol,
  TextVNodeSymbol,
  VNodeSymbol
} from './constant.js'

/** 唯一标识符 */
export type OnlyKey = string | number | bigint | symbol

// 辅助计算出元素类型
type ComputedRefElType<T> = T extends HTMLIntrinsicTags
  ? HtmlElementTagMap[T]
  : T extends Fragment
    ? DocumentFragment
    : ExcludeWidgetIntrinsicKeywords<T>

/** 引用元素类型 */
export type RefEl<T> = {
  value: ComputedRefElType<T> | null
  readonly [RefElSymbol]: true
}
/**
 * 绑定属性
 */
export type VBind = Record<string, any> | [props: Record<string, any>, exclude?: string[]]
/**
 * 全局属性
 */
export interface IntrinsicAttributes {
  /**
   * 控制一个 `Widget` 如何替换树中的另一个 `Widget`。
   *
   * 在运行时，如果两个Widget的`key`相同，则会更新已渲染的Widget，否则会移除旧Widget，然后插入新Widget。
   *
   * 这在某些情况下很有用，例如，当您想重新排序列表时。
   *
   * 通常，作为另一个 Widget 的唯一子项的 Widget 不需要显式键。
   */
  key?: OnlyKey
  /**
   * 引用组件
   */
  ref?: RefEl<any>
  /**
   * 绑定属性
   *
   * 可选值：
   *  - 对象Record<string, any>：要绑定给元素的属性，`style`|`class`|`className`，会和原有值进行合并。
   *  - 数组[props: Record<string, any>, exclude?: string[]]：第一个元素为要绑定给元素的属性，第二个元素为要排除的属性。
   */
  'v-bind'?: VBind

  [key: string]: any
}

/**
 * 组件类型
 */
export type WidgetType<P extends Record<string, any> = any> =
  | ClassWidgetConstructor<P>
  | FnWidgetConstructor<P>

/**
 * 主节点类型
 */
export type VNodeType = WidgetType | Fragment | HTMLIntrinsicTags
/**
 * Widget节点Props类型重载
 */
export type WidgetPropsType<T extends WidgetType> = (T extends WidgetType<infer P> ? P : {}) &
  IntrinsicAttributes
/**
 * HTML节点Props类型重载
 */
export type HTMLPropsType<T extends HTMLIntrinsicTags> =
  HtmlIntrinsicElements[T]
  & IntrinsicAttributes

/**
 * 节点Props类型重载
 */
export type VNodePropsType<T extends VNodeType> = T extends HTMLIntrinsicTags
  ? HTMLPropsType<T>
  : T extends WidgetType
    ? WidgetPropsType<T>
    : IntrinsicAttributes

/** 子节点类型 */
export type ChildVNode = VNode | TextVNode | CommentVNode

/** 子节点列表 */
export type VNodeChildren = Array<ChildVNode>

/** HtmlVNode元素实例类型 */
type HtmlElementType<T> = T extends Fragment
  ? VDocumentFragment
  : T extends HTMLIntrinsicTags
    ? HtmlElementTagMap[T]
    : HTMLElement | VDocumentFragment

/**
 * VNode节点对象基本类型
 *
 * 基本属性：
 * - type: 节点类型
 * - props: 节点属性
 * - ref: 引用
 * - key: 唯一键
 */
export interface VNode<T extends VNodeType = VNodeType> {
  /**
   * VNode对象标识符
   */
  [VNodeSymbol]: true
  /**
   * 节点类型
   */
  type: T
  /**
   * 节点属性
   */
  props: VNodePropsType<T>
  /**
   * 引用
   */
  ref: RefEl<T> | undefined
  /**
   * 唯一标识符
   */
  key: OnlyKey | undefined
  /**
   * 子节点列表
   *
   * 如果是`Widget`类型的节点，则写入到`vnode.props.children`，`vnode.children`始终为空数组
   */
  children: VNodeChildren
  /**
   * 小部件实例
   */
  instance?: Widget
  /**
   * 向下提供的数据
   */
  provide?: Record<string | symbol, any>
  /**
   * 元素实例
   */
  el?: HtmlElementType<T>
}

/** 文本节点，内部自动转换 */
export interface TextVNode {
  /**
   * 文本值
   */
  value: string
  /**
   * 元素实例
   */
  el?: Text
  [TextVNodeSymbol]: true
}

/**
 * 注释节点，内部使用
 */
export interface CommentVNode {
  /**
   * 文本值
   */
  value: string
  /**
   * 元素实例
   */
  el?: Comment
  [CommentVNodeSymbol]: true
}

/**
 * 小部件节点对象类型
 *
 * 独有属性：
 * - instance: 小部件实例
 * - provide: 向下提供的数据
 * - scope: 作用域
 */
export type WidgetVNode<T extends WidgetType = WidgetType> = VNode<T>

/**
 * HTML元素节点对象类型
 */
export type HTMLElementVNode<T extends HTMLIntrinsicTags = HTMLIntrinsicTags> = VNode<T>

/**
 * 片段节点
 */
export type FragmentVNode = VNode<Fragment>

/**
 * 判断是否为虚拟节点对象
 *
 * 注意：该方法仅判断是否为VNode对象，文本节点请使用`isTextVNode`方法判断
 *
 * @param obj
 */
export function isVNode(obj: any): obj is VNode {
  return obj?.[VNodeSymbol] === true
}

/**
 * 判断是否为Html元素节点
 *
 * @param obj
 */
export function isHtmlVNode(obj: any): obj is HTMLElementVNode {
  return typeof obj?.type === 'string'
}

/**
 * 判断是否为小部件节点
 *
 * @param obj
 */
export function isWidgetVNode(obj: any): obj is WidgetVNode {
  return typeof obj?.type === 'function'
}

/**
 * 判断是否为函数式小部件节点
 *
 * @param obj
 */
export function isFnWidgetVNode(obj: any): obj is WidgetVNode<FnWidgetConstructor> {
  return typeof obj?.type === 'function' && !isClassWidgetConstructor(obj.type)
}

/**
 * 判断是否为Fragment节点
 *
 * @param obj
 */
export function isFragmentVNode(obj: any): obj is FragmentVNode {
  return obj?.type === Fragment
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
 * 判断是否为注释节点
 *
 * @param obj
 */
export function isCommentVNode(obj: any): obj is CommentVNode {
  return obj?.[CommentVNodeSymbol] === true
}

/**
 * 判断是否为引用元素
 *
 * @param obj
 */
export function isRefEl(obj: any): obj is RefEl<any> {
  return obj?.[RefElSymbol] === true
}

