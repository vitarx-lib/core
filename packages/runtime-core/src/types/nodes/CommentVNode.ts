import type { CommentVNodeType } from '../vnode.js'
import { type NonElementVNode } from './BaseNode.js'

/**
 * 注释节点接口
 *
 * 表示HTML注释的虚拟节点，通常用于调试和开发工具。
 * 注释节点在DOM中不会显示给用户，但在开发模式下可用于
 * 标记模板中的特定位置或提供调试信息。
 *
 * 注释节点继承自NonElementVNode，因为它不能包含子节点，
 * 是DOM树中的叶子节点。
 */
export interface CommentVNode extends NonElementVNode<CommentVNodeType> {}
