import { ViewKind } from '../../constants/index.js'
import { IS_VIEW, IS_VIEW_BUILDER } from '../../constants/symbol.js'
import type { View } from '../../types/index.js'
import {
  type CommentView,
  type ComponentView,
  type DynamicView,
  type ElementView,
  type FragmentView,
  ListView,
  type TextView,
  type ViewBuilder
} from '../../view/index.js'

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
 * 检查给定值是否为ComponentView组件视图类型
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是ComponentView组件视图类型则返回true，否则返回false
 */
export const isComponentView = (val: any): val is ComponentView => {
  return val?.[IS_VIEW] && val.kind === ViewKind.COMPONENT
}

/**
 * 检查给定值是否为SwitchView条件视图类型
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是SwitchView条件视图类型则返回true，否则返回false
 */
export const isSwitchView = (val: any): val is DynamicView => {
  return val?.[IS_VIEW] && val.kind === ViewKind.DYNAMIC
}

/**
 * 检查给定值是否为TextView文本视图类型
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是TextView文本视图类型则返回true，否则返回false
 */
export const isTextView = (val: any): val is TextView => {
  return val?.[IS_VIEW] && val.kind === ViewKind.TEXT
}

/**
 * 检查给定值是否为CommentView注释视图类型
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是CommentView注释视图类型则返回true，否则返回false
 */
export const isCommentView = (val: any): val is CommentView => {
  return val?.[IS_VIEW] && val.kind === ViewKind.COMMENT
}

/**
 * 检查给定值是否为ElementView元素视图类型
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是ElementView元素视图类型则返回true，否则返回false
 */
export const isElementView = (val: any): val is ElementView => {
  return val?.[IS_VIEW] && val.kind === ViewKind.ELEMENT
}

/**
 * 检查给定值是否为FragmentView片段视图类型
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是FragmentView片段视图类型则返回true，否则返回false
 */
export const isFragmentView = (val: any): val is FragmentView => {
  return val?.[IS_VIEW] && val.kind === ViewKind.FRAGMENT
}

/**
 * 检查给定值是否为ListView列表视图类型
 *
 * @param val - 需要检查的任意值
 * @return {boolean} 如果值是ListView列表视图类型则返回true，否则返回false
 */
export const isListView = (val: any): val is ListView => {
  return val?.[IS_VIEW] && val.kind === ViewKind.LIST
}

/**
 * 检查给定值是否为ViewBuilder视图构建器类型
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是ViewBuilder视图构建器类型则返回true，否则返回false
 */
export const isViewBuilder = (val: any): val is ViewBuilder => {
  return val?.[IS_VIEW_BUILDER] === true
}
