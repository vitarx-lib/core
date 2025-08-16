import { LifecycleHooks } from './types/index'

/**
 * 组件内部保留方法
 */
export const __WIDGET_INTRINSIC_METHOD_KEYWORDS__ = [
  'build',
  'update',
  '$patchUpdate',
  ...Object.values(LifecycleHooks)
] as const

/**
 * 组件内部保留属性
 */
export const __WIDGET_INTRINSIC_PROPERTY_KEYWORDS__ = ['$scope', '$el', '$vnode'] as const

/**
 * 组件内部保留关键字
 */
export const __WIDGET_INTRINSIC_KEYWORDS__ = [
  ...__WIDGET_INTRINSIC_PROPERTY_KEYWORDS__,
  ...__WIDGET_INTRINSIC_METHOD_KEYWORDS__
] as const

/**
 * 简单函数组件的标识符
 */
export const SIMPLE_FUNCTION_WIDGET_SYMBOL = Symbol('SIMPLE_FUNCTION_WIDGET_SYMBOL')
/** 排除生命周期方法和保留属性 */
export type ExcludeWidgetIntrinsicKeywords<T> = Omit<
  T,
  (typeof __WIDGET_INTRINSIC_METHOD_KEYWORDS__)[number]
>
/**
 * 初始化函数组件的标识符
 */
export const __INITIALIZE_FN_WIDGET__ = Symbol('__INITIALIZE_FN_WIDGET__')
