import { hasPropTrack, PropertyRef } from '@vitarx/responsive'
import { isNumber, isString, logger } from '@vitarx/utils'
import { CommentView, TextView } from '../view/atomic.js'
import { SwitchView } from '../view/switch.js'
import { builder, type ViewBuilder } from './factory.js'

export interface TextProps {
  text: string
}

/**
 * TextView 组件化解析器
 *
 * @param props - Text 组件的属性对象
 * @param [props.text] - 文本内容
 * @return {TextView} TextView对象
 */
export const PlainText = builder(
  (props: TextProps, location): TextView | SwitchView<string> | CommentView => {
    const { value, isTrack } = hasPropTrack(props, 'text')
    if (__DEV__ && !isString(value) && !isNumber(value)) {
      logger.warn('[PlainText]: text must be a string.', value, location)
    }
    const str = String(value)
    return isTrack
      ? new SwitchView(new PropertyRef(props, 'text'), location)
      : str.length
        ? new TextView(str, location)
        : new CommentView('PlainText:empty', location)
  }
)

export type PlainText = ViewBuilder<TextProps, TextView | SwitchView<string> | CommentView> & {
  __is_text: true
}
