import type {
  HtmlElementTagMap,
  HtmlIntrinsicElements,
  HtmlTags,
  VElement
} from '../renderer/web-runtime-dom/index.js'
import type { ExcludeWidgetIntrinsicKeywords } from '../widget/constant.js'
import { type ClassWidgetConstructor, type FnWidgetConstructor, Widget } from '../widget/index.js'
import { Fragment, RefElSymbol, TextVNodeSymbol, VNodeSymbol } from './constant.js'

/** 唯一标识符 */
export type OnlyKey = string | number | bigint | symbol

// 辅助计算出元素类型
type ComputedRefElType<T> = T extends HtmlTags
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
}

// 节点类型
export type VNodeType = FnWidgetConstructor | ClassWidgetConstructor | Fragment | HtmlTags

// 节点属性结构
export type VNodeProps<T> = (T extends HtmlTags
  ? HtmlIntrinsicElements[T]
  : T extends ClassWidgetConstructor<infer P>
    ? P
    : T extends FnWidgetConstructor<infer P>
      ? P
      : {}) &
  IntrinsicAttributes

/** 子节点类型 */
export type VNodeChild = VNode | TextVNode

/** 子节点列表 */
export type VNodeChildren = Array<VNodeChild>

/** 文本节点，内部自动转换 */
export interface TextVNode {
  value: string
  el: Text | null
  [TextVNodeSymbol]: true
}

/**
 * 虚拟Node
 *
 * - `type`: 节点类型
 * - `props`: 节点属性
 * - `children`: 子节点列表，如果是函数小部件或类小部件则写入到`props.children`
 * - `key`: 节点唯一标识
 * - `ref`: 节点引用
 * - `el`: 节点元素实例
 * - `instance`: 仅用于函数或类小部件，表示小部件实例
 * - `provide`: 小部件提供的数据
 */
export type VNode<T extends VNodeType = VNodeType> = {
  type: T
  props: VNodeProps<T>
  children: VNodeChildren
  key: OnlyKey | null
  ref: RefEl<T> | null
  el: VElement | null
  instance?: Widget
  provide?: Record<string | symbol, any>
  [VNodeSymbol]: true
}

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
 * 判断是否为文本节点
 *
 * @param obj
 */
export function isTextVNode(obj: any): obj is TextVNode {
  return obj?.[TextVNodeSymbol] === true
}

/**
 * 判断是否为引用元素
 *
 * @param obj
 */
export function isRefEl(obj: any): obj is RefEl<any> {
  return obj?.[RefElSymbol] === true
}
