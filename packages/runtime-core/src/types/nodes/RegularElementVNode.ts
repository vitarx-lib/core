import type { RegularElementVNodeType } from '../vnode.js'
import type { ContainerVNode, ElementVNode } from './BaseNode.js'

/**
 * 常规元素节点接口
 *
 * 表示标准的HTML元素，如div、span、p等，这些元素可以包含子节点。
 * 常规元素节点有开始标签和结束标签，可以包含属性和子节点。
 *
 * 该接口同时继承自ElementVNode和ContainerVNode：
 * - ElementVNode提供了元素节点的基本属性和行为
 * - ContainerVNode提供了包含子节点的能力
 *
 * @template T 元素类型，默认为RegularElementVNodeType
 */
export interface RegularElementVNode<T extends RegularElementVNodeType = RegularElementVNodeType>
  extends ElementVNode<T>,
    ContainerVNode<T> {}
