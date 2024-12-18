// 标记Widget实例的props中自身节点的引用
import { LifeCycleHooks } from './life-cycle.js'

import type { ClassWidgetConstructor } from './widget.js'
import type { FnWidgetConstructor } from './fn-widget.js'

/**
 * 组件类型
 */
export type WidgetType<P extends Record<string, any> = {}> =
  | ClassWidgetConstructor<P>
  | FnWidgetConstructor<P>

/** 排除生命周期方法和保留属性 */
export type ExcludeWidgetIntrinsicKeywords<T> = Omit<
  T,
  Exclude<(typeof __widgetIntrinsicPropKeywords__)[number], 'el'>
>

// 内置方法列表
export const __WidgetIntrinsicMethods__ = [
  'build',
  'update',
  ...Object.values(LifeCycleHooks)
] as const


// 内置属性列表
export const __WidgetIntrinsicProps__ = [
  'vnode',
  'children',
  'props',
  'renderer',
  'el',
  '_renderer',
  '_props',
  '_vnode',
  'inject',
  'provide'
] as const

/**
 * 组件内部保留的属性关键字
 */
export const __widgetIntrinsicPropKeywords__ = [
  ...__WidgetIntrinsicProps__,
  ...__WidgetIntrinsicMethods__,
  ...Object.values(LifeCycleHooks)
] as const


