import type { AnyProps, ClassAttribute, StyleRules } from '../../types/index.js'
import { StyleUtils } from './style.js'

export function normalizeStyle<T extends AnyProps>(props: T): T {
  // 处理 style 属性
  if ('style' in props) {
    ;(props as unknown as Record<'style', StyleRules>).style = StyleUtils.cssStyleValueToObject(
      props.style
    )
  }
  // 处理 class 属性
  let cssClass: ClassAttribute =
    'class' in props ? StyleUtils.cssClassValueToArray(props.class as ClassAttribute) : []
  if ('className' in props) {
    cssClass = StyleUtils.mergeCssClass(cssClass, props.className as ClassAttribute)
    // @ts-ignore
    delete this.props.className
  }
  // 如果合并后的 class 存在，赋值给 newProps.class
  if (cssClass.length > 0) (props as unknown as Record<'class', string[]>).class = cssClass
  return props
}
