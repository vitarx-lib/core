/** 生命周期钩子枚举 */
export enum LifecycleHooks {
  create = 'onCreate',
  beforeMount = 'onBeforeMount',
  mounted = 'onMounted',
  deactivated = 'onDeactivated',
  activated = 'onActivated',
  beforeUpdate = 'onBeforeUpdate',
  updated = 'onUpdated',
  error = 'onError',
  unmounted = 'onUnmounted',
  beforeUnmount = 'onBeforeUnmount',
  beforeRemove = 'onBeforeRemove',
  serverPrefetch = 'onServerPrefetch'
}
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
/** 排除保留方法 */
export type ExcludeWidgetIntrinsicKeywords<T> = Omit<
  T,
  (typeof __WIDGET_INTRINSIC_METHOD_KEYWORDS__)[number]
>

/**
 * 类小部件的标识符
 */
export const CLASS_WIDGET_BASE_SYMBOL = Symbol('CLASS_WIDGET_SYMBOL')
