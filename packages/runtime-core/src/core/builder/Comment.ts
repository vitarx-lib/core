import { CommentView } from '../view/atomic.js'
import { builder, type ViewBuilder } from './factory.js'

export interface CommentProps {
  text: string
}
/**
 * CommentView 组件化构建器
 *
 * 用于创建 Comment 视图节点。
 *
 * @param props - Comment 节点的属性对象
 * @param [props.text] - 注释内容，不能动态更新！
 * @return {CommentView} CommentView
 */
export const Comment = builder((props: CommentProps, key, location): CommentView => {
  return new CommentView(String(props.text), key, location)
})

export type Comment = ViewBuilder<CommentProps, CommentView> & { __is_comment: true }
