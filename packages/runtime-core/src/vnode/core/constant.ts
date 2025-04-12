/** 虚拟节点标识符 */
export const VNodeSymbol = Symbol('VNode')
export type VNodeSymbol = typeof VNodeSymbol
/** 片段组件标识符 */
export const Fragment = Symbol('Fragment')
export type Fragment = () => any

/** 元素引用标记 */
export const RefElSymbol = Symbol('RefEl')
export type RefElSymbol = typeof RefElSymbol

/**
 * 用于存储当前Widget节点上下文的Symbol
 * @private
 */
export const VNodeContextSymbol = Symbol('VNode Context Symbol')
