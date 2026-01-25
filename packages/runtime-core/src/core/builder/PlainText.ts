import { isString, logger } from '@vitarx/utils'
import { TrackedCompute } from '../compiler/index.js'
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
  const textView = new TrackedCompute(() => {
    if (__DEV__ && !isString(props.text)) {
      logger.warn('[PlainText]: text must be a string.', props.text, location)
    }
    return String(props.text)
  })

  return textView.isStatic
    ? new TextView(textView.value, location)
    : new SwitchView(textView, location)
})

export type PlainText = ViewBuilder<TextProps, TextView | SwitchView<TextView>> & {
  __is_text: true
}
