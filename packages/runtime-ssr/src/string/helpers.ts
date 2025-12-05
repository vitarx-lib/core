import { StyleUtils } from '@vitarx/runtime-core'

/**
 * 转义HTML特殊字符以防止XSS攻击
 *
 * @param text - Text to escape
 * @returns Escaped text
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
 * @returns {string} 序列化属性字符串
 */
export function serializeAttributes(props: Record<string, any>): string {
  const attrs: string[] = []

  for (const key in props) {
    const value = props[key]
    // 跳过事件处理程序
    if (typeof value === 'function' || value === null || value === undefined || key === 'children')
      continue

    // Handle special attributes
    if (key === 'class' || key === 'className' || key === 'classname') {
      const className = StyleUtils.cssClassValueToString(value)
      if (className) {
        attrs.push(`class="${escapeHTML(className)}"`)
      }
      continue
    }

    if (key === 'style') {
      const styleText = StyleUtils.cssStyleValueToString(value)
      if (styleText) {
        attrs.push(`style="${escapeHTML(styleText)}"`)
      }
      continue
    }

    // Handle v-html
    if (key === 'v-html') {
      // V-HTML 在元素渲染中是单独处理的
      continue
    }

    // Handle boolean attributes
    if (typeof value === 'boolean') {
      if (value) attrs.push(key)
      continue
    }

    // Handle other attributes
    attrs.push(`${key}="${escapeHTML(String(value))}"`)
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : ''
}

/**
 * 生成开始标签
 *
 * @param tagName - 标签名称
 * @param props - 属性对象
 * @returns {string} Opening tag string
 */
export function tagOpen(tagName: string, props: Record<string, any>): string {
  const attrs = serializeAttributes(props)
  return `<${tagName}${attrs}>`
}

/**
 * 生成结束标签
 *
 * @param tagName - Tag name
 * @returns Closing tag string
 */
export function tagClose(tagName: string): string {
  return `</${tagName}>`
}

/**
 * 为空元素生成自闭标签
 *
 * @param tagName - Tag name
 * @param props - Properties object
 * @returns Self-closing tag string
 */
export function tagSelfClosing(tagName: string, props: Record<string, any>): string {
  const attrs = serializeAttributes(props)
  return `<${tagName}${attrs} />`
}
