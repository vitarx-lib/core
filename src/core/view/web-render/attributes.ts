import { isArray, isFunction, isRecordObject, isString } from '../../../utils/index.js'
import type { HTMLClassProperties, HTMLStyleProperties } from '../../../index.js'

/**
 * 设置属性
 *
 * @param el - 目标元素
 * @param props - 属性对象
 */
export function setAttributes(el: HTMLElement, props: Record<string, any>): void {
  Object.keys(props).forEach(key => {
    setAttribute(el, key, props[key])
  })
}

// 设置Html元素属性
export function setAttribute(el: HTMLElement, key: string, value: any, oldValue?: any): void {
  switch (key) {
    case 'style':
      setStyle(el, value)
      break
    case 'class':
      setClass(el, value)
      break
    default:
      if (isHTMLNodeEvent(el, key)) {
        if (!isFunction(value)) {
          throw new TypeError(`无效的事件处理程序，${key}: ${typeof value}`)
        }
        const event = key.slice(2).toLowerCase()
        // 删除旧的事件
        if (oldValue && isFunction(oldValue)) {
          el.removeEventListener(event, oldValue)
        }
        el.addEventListener(event, value)
      } else if (key.startsWith('data-')) {
        el.dataset[key.slice(5)] = value
      } else {
        try {
          // 处理其他属性
          if (key in el) {
            // @ts-ignore
            el[key] = value
          } else {
            el.setAttribute(key, value) // 设置未知属性
          }
        } catch (error) {
          console.error(`设置属性 ${key} 时发生错误:`, error)
        }
      }
      break
  }
}

/**
 * 判断是否为事件属性
 *
 * @param el
 * @param prop
 */
export function isHTMLNodeEvent(el: HTMLElement, prop: string): boolean {
  return prop.startsWith('on') && prop.toLowerCase() in el
}

/**
 * 设置内联样式
 *
 * @param el
 * @param style
 */
export function setStyle(el: HTMLElement, style: HTMLStyleProperties): void {
  if (style && el.style) {
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
export function setClass(el: HTMLElement, classData: HTMLClassProperties): void {
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
