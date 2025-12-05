import { COMMENT_NODE_TYPE, NodeKind, TEXT_NODE_TYPE } from '../../constants/index.js'
import type {
  CommentNode,
  CommentNodeType,
  TextNode,
  TextNodeType,
  VNodeInputProps
} from '../../types/index.js'
import { createBaseVNode } from './base.js'

/**
 * 创建文本节点
 *
 * createTextNode({value:"文本内容"})
 *
 * @param props - 节点属性对象
 * @returns 创建的文本虚拟节点
 */
export const createTextVNode = (props: VNodeInputProps<TextNodeType>): TextNode => {
  return createBaseVNode(TEXT_NODE_TYPE, NodeKind.TEXT, props) as TextNode
}

/**
 * 创建注释节点
 *
 * 注释节点在渲染时通常不显示在页面上，但在开发模式下可用于调试
 *
 * createCommentNode({value:"注释内容"})
 *
 * @param props - 节点属性对象
 * @returns 创建的注释虚拟节点
 */
export const createCommentVNode = (props: VNodeInputProps<CommentNodeType>): CommentNode => {
  return createBaseVNode(COMMENT_NODE_TYPE, NodeKind.COMMENT, props) as CommentNode
}
