import { CommentView } from '../view/atomic.js'
import { builder, type ViewBuilder } from './factory.js'

export interface CommentProps {
  text: string
}
/**
 * AnchorView 组件化构建器
 *
 * 用于创建 Anchor 视图节点。
 *
 * @param props - Anchor 节点的属性对象
 * @param [props.text] - 静态的锚点提示内容
 * @return {CommentView} AnchorView
 */
export const Comment = builder((props: CommentProps, key, location): CommentView => {
  return new CommentView(String(props.text), key, location)
})

export type Comment = ViewBuilder<CommentProps, CommentView> & { __is_comment: true }
