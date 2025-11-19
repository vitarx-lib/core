import type { TextVNodeType } from '../vnode.js'
import { type NonElementVNode } from './BaseNode.js'

/**
 * 文本节点接口
 *
 * 表示DOM中的文本内容节点，用于显示纯文本。
 * 文本节点是DOM树中的叶子节点，不能包含子节点，
 * 只能包含文本内容。
 *
 * 文本节点的内容存储在value属性中，可以是任何可转换为字符串的值。
 * 在渲染时，文本节点会被转换为DOM的Text对象。
 *
 * 文本节点继承自NonElementVNode，因为它不能包含子节点。
 */
export interface TextVNode extends NonElementVNode<TextVNodeType> {}
