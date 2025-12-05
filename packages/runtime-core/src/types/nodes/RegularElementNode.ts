import type { RegularElementNodeType } from '../vnode.js'
import type { ContainerNode, ElementNode } from './VNode.js'

/**
 * 常规元素节点接口
 *
 * 表示标准的HTML元素，如div、span、p等，这些元素可以包含子节点。
 * 常规元素节点有开始标签和结束标签，可以包含属性和子节点。
 *
 * 该接口同时继承自ElementNode和ContainerNode：
 * - ElementNode提供了元素节点的基本属性和行为
 * - ContainerNode提供了包含子节点的能力
 *
 * @template T 元素类型，默认为RegularElementNodeType
 */
export interface RegularElementNode<T extends RegularElementNodeType = RegularElementNodeType>
  extends ElementNode<T>,
    ContainerNode<T> {}
