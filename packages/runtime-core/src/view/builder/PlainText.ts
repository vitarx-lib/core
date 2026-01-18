import { isString, logger } from '@vitarx/utils'
import type { DynamicView, TextView } from '../../types/index.js'
import { TrackedCompute } from '../compiler/index.js'
import { createDynamicView } from '../creator/dynamic.js'
import { createTextView } from '../creator/text.js'
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
  (props: TextProps, key, location): TextView | DynamicView<string> => {
    const textView = new TrackedCompute(() => {
      if (__DEV__ && !isString(props.text)) {
        logger.warn('[PlainText]: text must be a string.', location)
      }
      return String(props.text)
    })

    return textView.isStatic
      ? createTextView(textView.value, key, location)
      : createDynamicView(textView, key, location)
  }
)

export type PlainText = ViewBuilder<TextProps, TextView | DynamicView<TextView>> & {
  __is_text: true
}
