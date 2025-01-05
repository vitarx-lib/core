import { isArray, isFunction, isRecordObject, isString } from '../../../utils/index.js'
import { type HTMLClassProperties, type HTMLStyleProperties } from './type.js'

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
      // 处理事件属性
      if (isFunction(value)) {
        if (oldCallback === value) return
        const event = key.slice(2).toLowerCase()
        // 删除旧的事件
        if (oldCallback && isFunction(oldCallback)) {
          el.removeEventListener(event, oldCallback)
        }
        el.addEventListener(event, value)
        return
      }
      // 如果属性以 data- 开头，则使用 dataset
      if (key.startsWith('data-')) {
        el.dataset[key.slice(5)] = value
        return
      }
      try {
        const isSvg = el instanceof SVGElement
        // 检查是否是需要使用 setAttributeNS 的属性
        if (isSvg) {
          if (key.startsWith('xlink:')) {
            // 对于 xlink:href 等需要使用 setAttributeNS
            el.setAttributeNS('http://www.w3.org/1999/xlink', key, String(value))
            return
          }
          if (key === 'href') {
            // SVG 中的 href 也需要使用命名空间
            el.setAttributeNS('http://www.w3.org/2000/svg', 'href', String(value))
            return
          }
        }
        const isWritable = key in el
        // 尝试使用 setAttribute
        if (isWritable) {
          const descriptor = Object.getOwnPropertyDescriptor(el, key)
          // 如果该属性是可写的，直接赋值
          if (descriptor && descriptor.set) {
            ;(el as any)[key] = value
            return
          }
        }
        // 如果属性不存在，使用 setAttribute
        el.setAttribute(key, String(value))
      } catch (error) {
        console.error(`[Vitarx.WebRuntimeDom]：设置属性 ${key} 时发生错误`, error, el)
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
