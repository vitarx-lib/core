import { IS_RAW } from '@vitarx/responsive'
import { IS_VIEW, ViewFlag, ViewState } from '../../constants/index.js'
import type { CodeLocation, CommentView } from '../../types/index.js'

export function createCommentView(
  text: string,
  key?: unknown,
  location?: CodeLocation
): CommentView {
  return {
    [IS_RAW]: true,
    [IS_VIEW]: true,
    state: ViewState.CREATED,
    key,
    location,
    flag: ViewFlag.COMMENT,
    text: text
  }
}
