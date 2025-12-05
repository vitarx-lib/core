import { StyleUtils } from '@vitarx/runtime-core'

/**
 * 转义HTML特殊字符以防止XSS攻击
 *
 * @param text - 要转义的文本
 * @returns 转义后的文本
 */
export function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 将属性序列化为字符串
 *
 * @param props - 属性对象
 * @returns 序列化属性字符串
 */
export function serializeAttributes(props: Record<string, any>): string {
  const attrs: string[] = []

  for (const key in props) {
    const value = props[key]
    // 跳过事件处理程序和特殊值
    if (typeof value === 'function' || value === null || value === undefined || key === 'children')
      continue

    // 处理 class 属性
    if (key === 'class' || key === 'className' || key === 'classname') {
      const className = StyleUtils.cssClassValueToString(value)
      if (className) {
        attrs.push(`class="${escapeHTML(className)}"`)
      }
      continue
    }

    // 处理 style 属性
    if (key === 'style') {
      const styleText = StyleUtils.cssStyleValueToString(value)
      if (styleText) {
        attrs.push(`style="${escapeHTML(styleText)}"`)
      }
      continue
    }

    // 跳过 v-html（在元素渲染中单独处理）
    if (key === 'v-html') {
      continue
    }

    // 处理布尔属性
    if (typeof value === 'boolean') {
      if (value) attrs.push(key)
      continue
    }

    // 处理其他属性
    attrs.push(`${key}="${escapeHTML(String(value))}"`)
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : ''
}

/**
 * 生成开始标签
 *
 * @param tagName - 标签名称
 * @param props - 属性对象
 * @returns 开始标签字符串
 */
export function tagOpen(tagName: string, props: Record<string, any>): string {
  const attrs = serializeAttributes(props)
  return `<${tagName}${attrs}>`
}

/**
 * 生成结束标签
 *
 * @param tagName - 标签名称
 * @returns 结束标签字符串
 */
export function tagClose(tagName: string): string {
  return `</${tagName}>`
}

/**
 * 为空元素生成自闭标签
 *
 * @param tagName - 标签名称
 * @param props - 属性对象
 * @returns 自闭合标签字符串
 */
export function tagSelfClosing(tagName: string, props: Record<string, any>): string {
  const attrs = serializeAttributes(props)
  return `<${tagName}${attrs} />`
}
