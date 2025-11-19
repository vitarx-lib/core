import type { VoidElementVNodeType } from '../vnode.js'
import type { ElementVNode } from './BaseNode.js'

/**
 * 空元素节点接口
 *
 * 表示自闭合的HTML元素，如img、input、br、hr等。
 * 这些元素在HTML中不能有子节点，也没有结束标签。
 *
 * 空元素节点继承自ElementVNode，但不继承ContainerVNode，
 * 因为它们不能包含子节点。这些元素通常用于特定的功能，
 * 如图片显示(img)、用户输入(input)、换行(br)等。
 *
 * @template T 元素类型，默认为VoidElementVNodeType
 */
export interface VoidElementVNode<T extends VoidElementVNodeType = VoidElementVNodeType>
  extends ElementVNode<T> {}
