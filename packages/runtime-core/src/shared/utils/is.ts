import type { View, Widget } from '../../types/index.js'
import { type ViewBuilder } from '../../view/index.js'
import { IS_VIEW, IS_VIEW_RESOLVER } from '../constants/symbol.js'

/**
 * 检查给定值是否为Widget组件类型
 *
 * 这是一个类型保护函数，用于在运行时验证变量是否为Widget组件类型
 *
 * 只要是函数/构造函数都会被判断为Widget组件类型，由于js语言特性，暂无更精准的判断方式。
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是函数类型则返回true，否则返回false
 */
export const isWidget = (val: any): val is Widget => {
  return typeof val === 'function'
}

/**
 * 检查给定值是否为View对象类型
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是View对象类型则返回true，否则返回false
 */
export const isView = (val: any): val is View => {
  return val?.[IS_VIEW] === true
}

/**
 * 检查给定值是否为ViewResolver对象类型
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是ViewResolver对象类型则返回true，否则返回false
 */
export const isViewResolver = (val: any): val is ViewBuilder => {
  return val?.[IS_VIEW_RESOLVER] === true
}
