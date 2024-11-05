import { Widget } from './widget.js'
import type { HtmlElementTags } from '../../types/html-elements'
import { isArray, isFunction, isRecordObject, isString, popProperty } from '../../utils/index.js'
import { VElement } from './VElement.js'
import type { CustomProperties, OverwriteHtmlProperties } from '../../types/html-global-properties'

type Props<T extends HtmlElementTags> = {
  [K in keyof JSX.IntrinsicElements[T]]: JSX.IntrinsicElements[T][K]
} & {
  tagName: T
  children?: string | Widget | Widget[]
} & JSX.IntrinsicAttributes

/**
 * html 小部件
 *
 * 该小部件用于创建 HTML 元素，并支持设置属性。
 *
 * @example
 * ```tsx
 * const widget = new HtmlWidget({
 *   tagName: 'div',
 *   children: 'Hello, World!',
 *   style: {
 *     color: 'red',
 *   },
 *   class: 'my-class',
 * })
 * ```
 * @template T - html 标签名称
 */
export class HtmlWidget<T extends HtmlElementTags = HtmlElementTags> extends Widget {
  readonly tagName: T
  readonly children?: Array<Widget | string>
  readonly props: Props<T>

  constructor(props: Props<T>) {
    super(props.key)
    this.tagName = popProperty(props, 'tagName')
    const children = popProperty(props, 'children')
    this.children = Array.isArray(children) ? children : children ? [children] : undefined
    this.props = props
  }

  protected createElement(): VElement<HtmlWidget> {
    return new RenderHtmlWidget(this)
  }
}

/**
 * 管理 HTML 元素
 */
class RenderHtmlWidget extends VElement<HtmlWidget> {
  protected createNode(): Node {
    const element = document.createElement(this.widget.tagName)
    setProps(element, this.widget.props)
    if (this.widget.children) {
      this.widget.children.forEach(child => {
        if (isString(child)) {
          element.appendChild(document.createTextNode(child))
        } else {
          // @ts-ignore 忽略受保护类型检查
          child.createElement().mount(element)
        }
      })
    }
    return element
  }
}

/**
 * 设置属性
 *
 * @param el
 * @param props
 */
function setProps(el: HTMLElement, props: Record<string, any>) {
  for (const key in props) {
    const value = props[key]
    switch (key) {
      case 'style':
        setStyle(el, value)
        break
      case 'class':
        setClass(el, value)
        break
      default:
        if (isHtmlEventProp(el, key)) {
          if (!isFunction(value)) {
            throw new TypeError(`无效的事件处理程序，${key}: ${typeof value}`)
          }
          el.addEventListener(key.slice(2).toLowerCase(), value)
        } else {
          // 处理其他属性
          if (key in el) {
            ;(el as any)[key] = value // 使用类型断言
          } else {
            el.setAttribute(key, value) // 设置未知属性
          }
        }
        break
    }
  }
}

/**
 * 判断是否为事件属性
 *
 * @param el
 * @param prop
 */
function isHtmlEventProp(el: HTMLElement, prop: string) {
  return prop.startsWith('on') && prop.toLowerCase() in el
}

/**
 * 设置内联样式
 *
 * @param el
 * @param style
 */
function setStyle(el: HTMLElement, style: OverwriteHtmlProperties['style']) {
  if (style) {
    if (isString(style)) {
      el.style.cssText = style
    } else if (isRecordObject(style)) {
      for (const key in style) {
        // @ts-ignore
        el.style[key] = style[key]
      }
    }
  }
}

/**
 * 设置样式类
 *
 * @param el
 * @param classData
 */
function setClass(el: HTMLElement, classData: CustomProperties['class']) {
  if (classData) {
    if (isString(classData)) {
      el.className = classData
    } else if (isArray(classData)) {
      el.classList.add(...classData)
    } else if (isRecordObject(Object)) {
      for (const key in classData) {
        if (classData[key]) {
          el.classList.add(key)
        } else {
          el.classList.remove(key)
        }
      }
    }
  }
}
