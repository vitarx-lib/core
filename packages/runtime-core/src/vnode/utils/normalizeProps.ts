import { unref } from '@vitarx/responsive'
import type { AnyProps, ClassAttribute, StyleRules } from '../../types/index.js'
import { StyleUtils } from './style.js'

/**
 * 标准化样式属性
 * 该函数用于处理传入的props中的style和class属性，将其转换为统一的格式
 * @param props 包含任意属性的输入对象
 * @returns {object} 返回处理后的标准化属性对象
 */
export function normalizeStyle<T extends AnyProps>(props: T): T {
  // 处理 style 属性
  if ('style' in props) {
    // 将样式值转换为对象格式
    ;(props as unknown as Record<'style', StyleRules>).style = StyleUtils.cssStyleValueToObject(
      props.style
    )
  }
  // 处理 class 属性
  let cssClass: ClassAttribute =
    'class' in props ? StyleUtils.cssClassValueToArray(props.class as ClassAttribute) : []
  if ('className' in props) {
    // 合并class和className属性
    cssClass = StyleUtils.mergeCssClass(cssClass, props.className as ClassAttribute)
    // @ts-ignore - 删除className属性，因为已经合并到class中
    delete this.props.className
  }
  // 如果合并后的 class 存在，赋值给 newProps.class
  if (cssClass.length > 0) (props as unknown as Record<'class', string[]>).class = cssClass
  return props
}

/**
 * 解包ref属性函数
 * 该函数会遍历传入的对象的所有属性，并将每个属性通过unref函数进行解包
 * @param props - 需要解包的属性对象，类型为AnyProps
 * @returns {object} 解包后的属性对象
 */
export function unwrapRefProps<T extends AnyProps>(props: T): T {
  // 检查props对象是否包含属性
  if (Object.keys(props).length) {
    // 解包ref
    for (const prop in props) {
      props[prop] = unref(props[prop])
    }
  }
  return props
}
