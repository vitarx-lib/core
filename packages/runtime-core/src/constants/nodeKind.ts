/**
 * 节点类型枚举，用于标识虚拟DOM中不同类型的节点
 */
export const enum NodeKind {
  /** 常规元素，如 <div>、<span> 等 */
  REGULAR_ELEMENT,
  /** 自闭合元素，如 <img>、<input>、<br> 等 */
  VOID_ELEMENT,
  /** 片段节点，用于包装多个子节点而不创建额外的DOM元素 */
  FRAGMENT,
  /** 文本节点 */
  TEXT,
  /** 注释节点 */
  COMMENT,
  /** 无状态组件节点 */
  STATELESS_WIDGET,
  /** 有状态组件节点 */
  STATEFUL_WIDGET
}

export const SPECIAL_NODE_KINDS = new Set([NodeKind.TEXT, NodeKind.COMMENT, NodeKind.FRAGMENT])
export const CONTAINER_NODE_KINDS = new Set([NodeKind.REGULAR_ELEMENT, NodeKind.FRAGMENT])
export const ELEMENT_NODE_KINDS = new Set([NodeKind.REGULAR_ELEMENT, NodeKind.VOID_ELEMENT])
export const WIDGET_NODE_KINDS = new Set([NodeKind.STATELESS_WIDGET, NodeKind.STATEFUL_WIDGET])
export const NON_ELEMENT_NODE_KINDS = new Set([NodeKind.TEXT, NodeKind.COMMENT])
