import { hasPropTrack, PropertyRef } from '@vitarx/responsive'
import { isNumber, isString, logger } from '@vitarx/utils'
import { TextView } from '../view/atomic.js'
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
export const PlainText = builder((props: TextProps, location): TextView | SwitchView<string> => {
  const text = props.text
  if (__DEV__ && !isString(props.text) && !isNumber(props.text)) {
    logger.warn('[PlainText]: text must be a string.', props.text, location)
  }
  const isDynamic = hasPropTrack(props, 'text')

  return isDynamic
    ? new SwitchView(new PropertyRef(props, 'text'), location)
    : new TextView(text, location)
})

export type PlainText = ViewBuilder<TextProps, TextView | SwitchView<string>> & {
  __is_text: true
}
