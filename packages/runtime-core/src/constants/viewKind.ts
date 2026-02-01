export const enum ViewKind {
  /** 文本节点 */
  TEXT,
  /** 锚点 */
  COMMENT,
  /** 片段节点，用于包装多个子节点而不创建额外的DOM元素 */
  FRAGMENT,
  /** 元素，如 `<div>`、`<span>` 等 */
  ELEMENT,
  /** 动态视图 */
  DYNAMIC,
  /** 列表视图 */
  LIST,
  /** 组件节点 */
  COMPONENT
}
