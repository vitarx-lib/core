import type { RefSignal } from '@vitarx/responsive'
import { VNode } from './nodes/index.js'
import type { Child } from './types/index.js'

/**
 * VNode对象标识符
 */
export const VNODE_SYMBOL = Symbol('VNODE_SYMBOL')

/**
 * 片段节点类型常量
 */
export const FRAGMENT_NODE_TYPE = 'fragment-node'
export type FRAGMENT_NODE_TYPE = typeof FRAGMENT_NODE_TYPE
/**
 * 片段元素组件
 *
 * 等价用法 `<Fragment>` 或 `<fragment-node>` 或 `<>`
 */
export const Fragment = FRAGMENT_NODE_TYPE as unknown as {
  (props: { children?: Child | Child[] }): VNode
  __isFragment__: true
}
export type Fragment = typeof Fragment

/**
 * 文本节点类型常量
 */
export const TEXT_NODE_TYPE = 'text-node'
export type TEXT_NODE_TYPE = typeof TEXT_NODE_TYPE
/**
 * 文本元素组件
 *
 * 通常你无需使用此标识符创建VNode，而是直接使用字符串作为子节点
 */
export const Text = TEXT_NODE_TYPE as unknown as {
  (props: { children: string | RefSignal<string> }): VNode
  __isText__: true
}
export type Text = typeof Text

/**
 * 注释节点类型常量
 */
export const COMMENT_NODE_TYPE = 'comment-node'
export type COMMENT_NODE_TYPE = typeof COMMENT_NODE_TYPE
/**
 * 注释元素组件
 *
 * 等价用法 `<Comment>`或`<comment-node>`
 */
export const Comment = COMMENT_NODE_TYPE as unknown as {
  (props: { children: string | RefSignal<string> }): VNode
  __isComment__: true
}
export type Comment = typeof Comment
