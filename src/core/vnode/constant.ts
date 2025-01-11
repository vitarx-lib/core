import type { VNode } from './type.js'

/** 虚拟节点标识符 */
export const VNodeSymbol = Symbol('VNode')
export type VNodeSymbol = typeof VNodeSymbol

/** 文本节点标识符 */
export const TextVNodeSymbol = Symbol('TextNode')
export type TextVNodeSymbol = typeof TextVNodeSymbol

/** 片段组件标识符 */
export const Fragment = Symbol('Fragment') as unknown as () => VNode
export type Fragment = () => VNode

/** 响应式元素引用标记 */
export const RefElSymbol = Symbol('RefEl')
export type RefElSymbol = typeof RefElSymbol

/**
 * 注释节点标识符
 */
export const CommentVNodeSymbol = Symbol('CommentVNode')
export type CommentVNodeSymbol = typeof CommentVNodeSymbol
