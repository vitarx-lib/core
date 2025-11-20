import { LifecycleHooks } from './hook.js'

/**
 * 组件内部保留方法
 */
export const __WIDGET_INTRINSIC_METHOD_KEYWORDS__ = [
  'build',
  '$forceUpdate',
  '$patchUpdate',
  ...Object.values(LifecycleHooks)
] as const
/**
 * 组件内部保留属性
 */
export const __WIDGET_INTRINSIC_PROPERTY_KEYWORDS__ = [
  '$scope',
  '$el',
  '$vnode',
  'children'
] as const
/**
 * 组件内部保留关键字
 */
export const __WIDGET_INTRINSIC_KEYWORDS__: ReadonlySet<string> = new Set([
  ...__WIDGET_INTRINSIC_PROPERTY_KEYWORDS__,
  ...__WIDGET_INTRINSIC_METHOD_KEYWORDS__
])
