import { isString, logger } from '@vitarx/utils'
import type { CommentView, DynamicView, ViewResolver } from '../../types/index.js'
import { createCommentView } from '../creator/comment.js'
import { createDynamicView } from '../creator/dynamic.js'
import { viewRef } from '../runtime/ref.js'
import { viewResolver } from './factory.js'

export interface CommentProps {
  text: string
}
/**
 * CommentView 组件化解析器
 *
 * 用于创建 Comment 视图节点。
 *
 * @param props - Comment 节点的属性对象
 * @param [props.text] - 文本内容
 * @return {CommentView} CommentView/DynamicView<CommentView>
 */
export const Comment = viewResolver(
  (props: CommentProps, key, location): CommentView | DynamicView<CommentView> => {
    const commentView = viewRef(() => {
      if (__DEV__ && !isString(props.text)) {
        logger.warn('[Comment]: text must be a string.', location)
      }
      return createCommentView(String(props.text), key, location)
    })
    return commentView.hasDynamic ? createDynamicView(commentView, location) : commentView.value
  }
)

export type Comment = ViewResolver<CommentProps, CommentView> & { __is_comment: true }
