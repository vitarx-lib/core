import {
  type HostComment,
  type HostElementTag,
  type HostText,
  ViewKind
} from '@vitarx/runtime-core'

export type DOMElement = Element
export type DOMNode = HostText | HostComment | Element
export type DOMNodeList = DOMNode[]
export type NodeDescTag =
  | HostElementTag
  | 'fragment-node'
  | 'list-node'
  | 'text-node'
  | 'comment-node'
export interface NodeInfo {
  /** 当前节点/元素，如果是数组则代表是片段 */
  el: DOMNode | DOMNodeList
  /** 下一个索引 */
  nextIndex: number
  /** 对应的视图kind */
  kind: ViewKind
  /** 标签 */
  tag: NodeDescTag
}
