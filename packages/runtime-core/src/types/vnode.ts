/**
 * 虚拟节点类型定义文件
 *
 * 本文件定义了Vitarx框架中虚拟节点的各种类型和接口，
 * 包括虚拟节点的属性、元素类型以及开发模式下的调试信息。
 */

import type {
  COMMENT_NODE_TYPE,
  DynamicRenderType,
  FRAGMENT_NODE_TYPE,
  IS_VNODE_BUILDER,
  NodeKind,
  TEXT_NODE_TYPE
} from '../constants/index.js'
import type { Dynamic, Fragment } from '../widget/index.js'
import type {
  HostNodeElements,
  HostNodeNames,
  HostRegularElementNames,
  HostVoidElementNames,
  JSXElementNames
} from './element.js'
import type {
  CommentNode,
  FragmentNode,
  RegularElementNode,
  StatefulWidgetNode,
  StatelessWidgetNode,
  TextNode,
  VNode,
  VoidElementNode
} from './nodes/index.js'
import type { AnyProps, StatefulWidget, StatelessWidget, WidgetType } from './widget.js'

/**
 * 代码位置信息
 */
export type SourceLocation = {
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
  source: SourceLocation
  /** 节点的原始`this`上下文，可用于调试 */
  self: any
}

export type StatefulWidgetNodeType = StatefulWidget
export type StatelessWidgetNodeType = StatelessWidget
export type RegularElementNodeType = HostRegularElementNames
export type VoidElementNodeType = HostVoidElementNames
export type TextNodeType = typeof TEXT_NODE_TYPE
export type CommentNodeType = typeof COMMENT_NODE_TYPE
export type WidgetNodeType = StatefulWidgetNodeType | StatelessWidgetNodeType
export type NonElementNodeType = TextNodeType | CommentNodeType
export type ContainerNodeType = RegularElementNodeType | FragmentNodeType
export type FragmentNodeType = typeof FRAGMENT_NODE_TYPE
export type ElementNodeType = RegularElementNodeType | VoidElementNodeType
export type HostNodeType = Exclude<NodeType, WidgetNodeType>
/**
 * 节点类型枚举到节点类型构造函数的映射
 *
 * 这个接口定义了NodeKind枚举值与对应的节点类型构造函数之间的映射关系。
 * 它允许在运行时根据节点类型枚举值动态获取对应的节点类型构造函数。
 */
export interface NodeKindToNodeType {
  [NodeKind.REGULAR_ELEMENT]: RegularElementNodeType
  [NodeKind.VOID_ELEMENT]: VoidElementNodeType
  [NodeKind.FRAGMENT]: FragmentNodeType
  [NodeKind.TEXT]: TextNodeType
  [NodeKind.COMMENT]: CommentNodeType
  [NodeKind.STATELESS_WIDGET]: StatelessWidgetNodeType
  [NodeKind.STATEFUL_WIDGET]: StatefulWidgetNodeType
}

/**
 * 节点类型枚举到节点实例类型的映射
 *
 * 这个接口定义了NodeKind枚举值与对应的节点实例类型之间的映射关系。
 * 它允许在运行时根据节点类型枚举值动态获取对应的节点实例类型。
 */
export interface NodeKindToNode {
  [NodeKind.REGULAR_ELEMENT]: RegularElementNode
  [NodeKind.VOID_ELEMENT]: VoidElementNode
  [NodeKind.FRAGMENT]: FragmentNode
  [NodeKind.TEXT]: TextNode
  [NodeKind.COMMENT]: CommentNode
  [NodeKind.STATELESS_WIDGET]: StatelessWidgetNode
  [NodeKind.STATEFUL_WIDGET]: StatefulWidgetNode
}

/**
 * 虚拟节点类型定义
 */
export type NodeType =
  | RegularElementNodeType
  | VoidElementNodeType
  | FragmentNodeType
  | TextNodeType
  | CommentNodeType
  | WidgetNodeType

/**
 * 可渲染的数据类型
 *
 * `Renderable` 表示框架可渲染的最小单元节点类型：
 * - null / undefined / boolean：条件渲染占位（注释节点）
 * - string / number / bigint：文本节点
 * - VNode：任意类型的虚拟节点
 */
export type Renderable = null | undefined | boolean | number | string | bigint | VNode
/**
 * 任意可作为 children 的结构
 */
export type AnyChild = Renderable | Iterable<AnyChild>

/**
 * 归一化后的 children 列表
 */
export type NormalizedChildren = VNode[]
/**
 * createVNode支持的节点类型
 *
 * 此节点类型是JSX中可用的所有元素类型的联合类型，包括：
 * - 内置元素名称（如div、span等HTML标签）和 固有的特殊元素（如fragment、text、comment等）
 * - Fragment类型，用于包装多个子元素而不产生额外DOM节点
 * - Dynamic类型，表示动态渲染
 * - 函数组件，类组件等等组件类型
 * - VNodeBuilder类型，特殊的节点构建器，用于创建虚拟节点
 *
 * 注意：此元素类型仅提供给 `createVNode` 使用，实际的运行时虚拟节点类型是 `VNodeType` 类型所定义的。
 */
export type CreatableType = JSXElementNames | WidgetType | VNodeBuilder

/**
 * 获取可创建的VNode类型对应的VNode实例类型
 *
 * 这是一个条件类型，用于根据CreatableVNodeType获取对应的VNode实例类型。
 * 支持处理多种情况：
 * 1. 如果是VNodeBuilder，则提取其返回类型R
 * 2. 如果是Dynamic类型，则返回VNodeFrom类型
 * 3. 如果是Fragment类型，则返回FragmentVNode
 * 4. 如果是其他VNodeTypes，则使用VNodeFrom<T>获取对应类型
 *
 * @template T - 可创建的VNode类型
 *
 * @example
 * // 假设有一个VNodeBuilder
 * const builder = createVNodeBuilder('div');
 * // DivVNode类型
 * type DivVNodeType = VNodeOf<typeof builder>;
 *
 * // FragmentVNode类型
 * type FragmentType = VNodeOf<Fragment>;
 */
export type VNodeOf<T extends CreatableType> =
  T extends VNodeBuilder<any, infer R>
    ? R
    : T extends Dynamic | DynamicRenderType
      ? VNode
      : T extends Fragment | FragmentNodeType
        ? FragmentNode
        : T extends TextNodeType
          ? TextNode
          : T extends CommentNodeType
            ? CommentNode
            : T extends VoidElementNodeType
              ? VoidElementNode<T>
              : T extends RegularElementNodeType
                ? RegularElementNode<T>
                : T extends StatelessWidgetNodeType
                  ? StatelessWidgetNode<T>
                  : T extends StatefulWidgetNodeType
                    ? StatefulWidgetNode<T>
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
export type ElementOf<T extends NodeType = NodeType> = T extends HostNodeNames
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
export type VNodeBuilder<P extends AnyProps = AnyProps, R extends VNode = VNode> = {
  (props: P): R
  [IS_VNODE_BUILDER]: true
}
