import { IS_VIEW, IS_VIEW_BUILDER } from '../../constants/symbol.js'
import { type ViewBuilder } from '../../core/index.js'
import type { View } from '../../types/index.js'

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
  return val?.[IS_VIEW_BUILDER] === true
}
