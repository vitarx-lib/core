import { isArray, isFunction, isRecordObject, isString } from '../../../utils/index.js'
import type { HTMLClassProperties, HTMLStyleProperties } from './type.js'

/**
 * 设置元素的多个属性
 *
 * @param el - 目标元素
 * @param props - 属性对象
 */
export function setAttributes(el: HTMLElement | SVGElement, props: Record<string, any>): void {
  Object.keys(props).forEach(key => {
    setAttribute(el, key, props[key])
  })
}

/**
 * 设置元素属性
 *
 * @param el - 目标元素
 * @param key - 属性名
 * @param value - 属性值
 * @param oldCallback - 旧回调函数，仅对事件属性生效
 */
export function setAttribute(
  el: HTMLElement | SVGElement,
  key: string,
  value: any,
  oldCallback?: AnyCallback
): void {
  switch (key) {
    case 'style':
      setStyle(el, value)
      break
    case 'className':
    case 'class':
      setClass(el, value)
      break
    case 'v-html':
      el.innerHTML = value
      break
    default:
      if (isFunction(value)) {
        if (oldCallback === value) return
        const event = key.slice(2).toLowerCase()
        // 删除旧的事件
        if (oldCallback && isFunction(oldCallback)) {
          el.removeEventListener(event, oldCallback)
        }
        el.addEventListener(event, value)
      } else if (key.startsWith('data-')) {
        el.dataset[key.slice(5)] = value
      } else {
        try {
          // 检查属性是否可写
          if (key in el) {
            const descriptor = Object.getOwnPropertyDescriptor(el, key)
            // 如果该属性是可写的，直接赋值
            if (descriptor && descriptor.set) {
              ;(el as any)[key] = value
            } else {
              // 否则使用 setAttribute
              el.setAttribute(key, String(value))
            }
          } else {
            // 如果属性不存在，使用 setAttribute
            el.setAttribute(key, String(value))
          }
        } catch (error) {
          console.error(`[Vitarx.WebRuntimeDom]：设置属性 ${key} 时发生错误`, error)
        }
      }
  }
}

/**
 * 删除属性
 *
 * @param el - 目标元素
 * @param key - 属性名
 * @param callback - 事件回调函数，仅对事件属性生效
 */
export function removeAttribute(el: HTMLElement | SVGElement, key: string, callback?: AnyCallback) {
  if (key === 'className') {
    el.removeAttribute('class')
  } else if (isFunction(callback)) {
    el.removeEventListener(key.slice(2).toLowerCase(), callback)
  } else {
    el.removeAttribute(key)
  }
}

/**
 * 设置内联样式
 *
 * @param el
 * @param style
 */
export function setStyle(el: HTMLElement | SVGElement, style: HTMLStyleProperties): void {
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
export function setClass(el: HTMLElement | SVGElement, classData: HTMLClassProperties): void {
  if (classData) {
    if (isString(classData)) {
      el.setAttribute('class', classData)
    } else if (isArray(classData)) {
      // 替换类名：清空后添加新的类名
      el.setAttribute('class', classData.join(' '))
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
