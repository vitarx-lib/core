/**
 * 虚拟节点类型定义文件
 *
 * 本文件定义了Vitarx框架中虚拟节点的各种类型和接口，
 * 包括虚拟节点的属性、元素类型以及开发模式下的调试信息。
 */

import {
  COMMENT_NODE_TYPE,
  type DynamicRenderType,
  type Fragment,
  FRAGMENT_NODE_TYPE,
  type Render,
  TEXT_NODE_TYPE
} from '../constants/index.js'
import {
  CommentNode,
  FragmentNode,
  RegularElementNode,
  StatefulWidgetNode,
  StatelessWidgetNode,
  TextNode,
  VNode
} from '../vnode/index.js'
import type {
  HostNodeElements,
  HostNodeNames,
  HostRegularElementNames,
  HostVoidElementNames,
  JSXElementNames
} from './element.js'
import type { StatefulWidget, StatelessWidget, WidgetType } from './widget.js'

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

/**
 * 虚拟节点类型定义
 */
export type NodeTypes =
  | RegularElementNodeType
  | VoidElementNodeType
  | FragmentNodeType
  | TextNodeType
  | CommentNodeType
  | WidgetType
/**
 * 支持渲染的元素类型定义
 *
 * `VNodeChild` 表示框架可渲染的最小单元节点类型：
 * - null / undefined / boolean：条件渲染占位（注释节点）
 * - string / number / bigint：文本节点
 * - VNode：虚拟节点
 */
export type VNodeChild = null | undefined | boolean | number | string | bigint | VNode
/**
 * 支持渲染的子节点列表类型
 *
 * `VNodeChildren` 表示 createVNode 可接受的子节点输入，
 * 可以是单个 VNodeChild 或可迭代的 VNodeChild 集合。
 */
export type VNodeChildren = VNodeChild | Iterable<VNodeChild>
/**
 * 运行时子节点列表类型
 *
 * `VNodeNormalizedChildren` 仅代表节点内部规范化后的子节点列表类型
 */
export type VNodeNormalizedChildren = Array<VNode>
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
export type ValidNodeType = JSXElementNames | Fragment | Render | WidgetType
/**
 * 挂载类型
 *
 * 挂载类型定义了节点的挂载方式，包括插入、替换、追加等。
 */
export type MountType = 'insertBefore' | 'replace' | 'appendChild'
/**
 * 节点实例类型重载
 */
export type VNodeInstanceType<T extends ValidNodeType> = T extends Render | DynamicRenderType
  ? VNode
  : T extends Fragment | FragmentNodeType
    ? FragmentNode
    : T extends TextNodeType
      ? TextNode
      : T extends CommentNodeType
        ? CommentNode
        : T extends RegularElementNodeType
          ? RegularElementNode<T>
          : T extends StatelessWidget
            ? StatelessWidgetNode
            : T extends WidgetType
              ? StatefulWidgetNode
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
export type NodeElementType<T extends NodeTypes = NodeTypes> = T extends HostNodeNames
  ? HostNodeElements<T>
  : HostNodeElements
