// 标记Widget实例的props中自身节点的引用
import { LifeCycleHooks } from './life-cycle.js'

/** 排除生命周期方法和保留属性 */
export type ExcludeWidgetIntrinsicKeywords<T> = Omit<
  T,
  Exclude<(typeof __widgetIntrinsicPropKeywords__)[number], 'el'>
>

// 内置方法列表
export const __WidgetIntrinsicMethods__ = [
  'build',
  'update',
  'initializeRenderer',
  ...Object.values(LifeCycleHooks)
] as const

/**
 * 内置属性列表
 */
export const __WidgetIntrinsicProps__ = [
  'vnode',
  'children',
  'props',
  'vnode',
  'scope',
  'renderer',
  'el',
  '_$renderer',
  '_$props',
  '_$vnode',
  '_$scope',
  'inject',
  'provide'
] as const

/**
 * 组件内部保留关键字
 */
export const __widgetIntrinsicPropKeywords__ = [
  ...__WidgetIntrinsicProps__,
  ...__WidgetIntrinsicMethods__,
  ...Object.values(LifeCycleHooks)
] as const
