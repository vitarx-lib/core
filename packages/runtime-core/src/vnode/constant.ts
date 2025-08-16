import { VNode } from './nodes'
import type { Child } from './types'

/**
 * 片段元素标识符
 */
export const Fragment = 'fragment-node' as unknown as (props: {
  children?: Child | Child[]
}) => VNode

export type Fragment = typeof Fragment
/**
 * 文本元素标识符
 *
 * 通常你无需使用此标识符创建VNode，而是直接使用字符串作为子节点
 */
export const Text = 'text-node' as unknown as (props: { children: string }) => VNode

export type Text = typeof Text

/**
 * 注释元素标识符
 *
 * 由于jsx特性，需要将注释展示到DOM树中，则需要使用<Comment>/<comment-node>标识符做为元素
 */
export const Comment = 'comment-node' as unknown as (props: { children: string }) => VNode
export type Comment = typeof Comment
