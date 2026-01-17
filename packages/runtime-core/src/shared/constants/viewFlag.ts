export const enum ViewFlag {
  /** 文本节点 */
  TEXT,
  /** 锚点 */
  ANCHOR,
  /** 片段节点，用于包装多个子节点而不创建额外的DOM元素 */
  FRAGMENT,
  /** 元素，如 `<div>`、`<span>` 等 */
  ELEMENT,
  /** 动态块 */
  DYNAMIC,
  /** 组件节点 */
  WIDGET
}
