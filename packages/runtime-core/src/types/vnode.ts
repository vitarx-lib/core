/**
 * 虚拟节点类型定义文件
 *
 * 本文件定义了Vitarx框架中虚拟节点的各种类型和接口，
 * 包括虚拟节点的属性、元素类型以及开发模式下的调试信息。
 */

import {
  COMMENT_NODE_TYPE,
  type Dynamic,
  type DynamicRenderType,
  type Fragment,
  FRAGMENT_NODE_TYPE,
  NodeKind,
  TEXT_NODE_TYPE,
  VNODE_BUILDER_SYMBOL
} from '../constants/index.js'
import type {
  HostNodeElements,
  HostNodeNames,
  HostRegularElementNames,
  HostVoidElementNames,
  JSXElementNames
} from './element.js'
import type {
  CommentVNode,
  FragmentVNode,
  RegularElementVNode,
  StatefulWidgetVNode,
  StatelessWidgetVNode,
  TextVNode,
  VNode,
  VoidElementVNode
} from './nodes/index.js'
import type { VNodeInputProps } from './props.js'
import type { StatefulWidget, StatelessWidget, WidgetTypes } from './widget.js'

/**
 * 代码位置信息
 */
export type CodeSourceInfo = {
  /** 源文件名 */
  fileName: string
  /** 源代码行号 */
  lineNumber: number
  /** 源代码列号 */
  columnNumber: number
}
/**
 * 开发模式下的调试信息
 *
 * 在开发模式下，每个虚拟节点会包含额外的调试信息，帮助开发者定位问题。
 * 这些信息包括节点是否静态、源代码位置以及节点的原始引用。
 */
export interface NodeDevInfo {
  /** 标记节点是否静态，静态节点在更新时可能跳过比较 */
  isStatic: boolean
  /** 源代码位置信息，用于错误追踪和调试 */
  source: CodeSourceInfo
  /** 节点的原始`this`上下文，可用于调试 */
  self: any
}

export type StatefulWidgetVNodeType = StatefulWidget
export type StatelessWidgetVNodeType = StatelessWidget
export type RegularElementVNodeType = HostRegularElementNames
export type VoidElementVNodeType = HostVoidElementNames
export type TextVNodeType = typeof TEXT_NODE_TYPE
export type CommentVNodeType = typeof COMMENT_NODE_TYPE
export type WidgetVNodeType = StatefulWidgetVNodeType | StatelessWidgetVNodeType
export type NonElementVNodeType = TextVNodeType | CommentVNodeType
export type ContainerVNodeType = RegularElementVNodeType | FragmentVNodeType
export type FragmentVNodeType = typeof FRAGMENT_NODE_TYPE
export type ElementVNodeType = RegularElementVNodeType | VoidElementVNodeType

export interface NodeKindToNodeType {
  [NodeKind.REGULAR_ELEMENT]: RegularElementVNodeType
  [NodeKind.VOID_ELEMENT]: VoidElementVNodeType
  [NodeKind.FRAGMENT]: FragmentVNodeType
  [NodeKind.TEXT]: TextVNodeType
  [NodeKind.COMMENT]: CommentVNodeType
  [NodeKind.STATELESS_WIDGET]: StatelessWidgetVNodeType
  [NodeKind.STATEFUL_WIDGET]: StatefulWidgetVNodeType
}
/**
 * 虚拟节点类型定义
 */
export type VNodeTypes =
  | RegularElementVNodeType
  | VoidElementVNodeType
  | FragmentVNodeType
  | TextVNodeType
  | CommentVNodeType
  | WidgetVNodeType

/**
 * 运行时元素类型定义
 *
 * `HostNodeElement` 表示运行时元素类型，
 * 它是 `HostNodeNames` 的子集，表示运行时元素类型。
 */
export type HostVNodeType = Exclude<VNodeTypes, WidgetVNodeType>

/**
 * 归一化后的虚拟节点类型
 */
export type NormalizedRenderable = VNode
/**
 * 可渲染的数据类型
 *
 * `Renderable` 表示框架可渲染的最小单元节点类型：
 * - null / undefined / boolean：条件渲染占位（注释节点）
 * - string / number / bigint：文本节点
 * - VNode：任意类型的虚拟节点
 */
export type Renderable =
  | null
  | undefined
  | boolean
  | number
  | string
  | bigint
  | NormalizedRenderable
/**
 * 任意可作为 children 的结构
 */
export type AnyChild = Renderable | Iterable<AnyChild>

/**
 * 归一化后的 children 列表
 */
export type VNodeNormalizedChildren = NormalizedRenderable[]
/**
 * createVNode支持的节点类型
 *
 * 此节点类型是JSX中可用的所有元素类型的联合类型，包括：
 * - 内置元素名称（如div、span等HTML标签）和 固有的特殊元素（如fragment、text、comment等）
 * - Fragment类型，用于包装多个子元素而不产生额外DOM节点
 * - Render类型，表示动态渲染
 * - 组件结构类型，表示自定义组件
 *
 * 注意：此元素类型仅提供给 `createVNode` 使用，实际的虚拟节点类型是 `VNodeType`
 */
export type ValidNodeType = JSXElementNames | Fragment | Dynamic | WidgetTypes

/**
 * 节点实例类型重载
 */
export type VNodeInstanceType<T extends ValidNodeType> = T extends Dynamic | DynamicRenderType
  ? VNode
  : T extends Fragment | FragmentVNodeType
    ? FragmentVNode
    : T extends TextVNodeType
      ? TextVNode
      : T extends CommentVNodeType
        ? CommentVNode
        : T extends VoidElementVNodeType
          ? VoidElementVNode<T>
          : T extends RegularElementVNodeType
            ? RegularElementVNode<T>
            : T extends StatelessWidget
              ? StatelessWidgetVNode<T>
              : T extends WidgetTypes
                ? StatefulWidgetVNode<T>
                : VNode

/**
 * 运行时元素实例类型
 *
 * 根据虚拟节点类型 T 推导出对应的运行时元素实例类型。
 * 如果 T 是 HostNodeElement 中的键，则返回对应的元素类型；
 * 否则返回 HostNodeElement 中所有值的联合类型。
 *
 * @template T 虚拟节点类型
 */
export type NodeElementType<T extends VNodeTypes = VNodeTypes> = T extends HostNodeNames
  ? HostNodeElements<T>
  : HostNodeElements
/**
 * 节点构建器类型定义
 *
 * 节点构建器是一个函数，用于创建虚拟节点。
 * 它接收一个参数 props，表示节点的属性。
 * 返回一个虚拟节点对象。
 *
 * @template T 虚拟节点类型
 */
export type VNodeBuilder<T extends VNodeTypes = VNodeTypes> = {
  (props: VNodeInputProps<T>): VNode<T>
  [VNODE_BUILDER_SYMBOL]: true
}
