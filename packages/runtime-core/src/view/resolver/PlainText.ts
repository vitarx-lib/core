import { isString, logger } from '@vitarx/utils'
import type { DynamicView, TextView, ViewResolver } from '../../types/index.js'
import { createDynamicView } from '../creator/dynamic.js'
import { createTextView } from '../creator/text.js'
import { viewRef } from '../runtime/ref.js'
import { viewResolver } from './factory.js'

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
export const PlainText = viewResolver(
  (props: TextProps, key, location): TextView | DynamicView<TextView> => {
    const textView = viewRef(() => {
      if (__DEV__ && !isString(props.text)) {
        logger.warn('[PlainText]: text must be a string.', location)
      }
      return createTextView(String(props.text), key, location)
    })
    return textView.value ? createDynamicView(textView, location) : textView.value
  }
)

export type PlainText = ViewResolver<TextProps, TextView> & { __is_text: true }
