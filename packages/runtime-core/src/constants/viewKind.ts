export const enum ViewKind {
  /** 文本节点 */
  TEXT = 1 << 0,
  /** 锚点 */
  COMMENT = 1 << 1,
  /** 片段节点，用于包装多个子节点而不创建额外的DOM元素 */
  FRAGMENT = 1 << 2,
  /** 元素，如 `<div>`、`<span>` 等 */
  ELEMENT = 1 << 3,
  /** 动态视图 */
  DYNAMIC = 1 << 4,
  /** 列表视图 */
  LIST = 1 << 5,
  /** 组件节点 */
  COMPONENT = 1 << 6
}
