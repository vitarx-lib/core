import type { RefSignal } from '@vitarx/responsive'
import type { AnyPrimitive } from '@vitarx/utils'
import { type ClassWidget, type FunctionWidget } from '../../widget'
import { VNode } from '../nodes'
import type { AllNodeElementName, NodeElement } from './element'
import type { IntrinsicProperties } from './properties'

/**
 * 表示可以作为子节点的类型
 */
export type Child =
  | VNode
  | Exclude<AnyPrimitive, symbol>
  | RefSignal<VNode | Exclude<AnyPrimitive, symbol>>
  | Array<Child>
/**
 * 小部件类型
 */
export type WidgetType<P extends Record<string, any> = any> = ClassWidget<P> | FunctionWidget<P>
/**
 * 虚拟节点类型
 */
export type VNodeType = AllNodeElementName | WidgetType
/**
 * Widget节点Props类型重载
 */
export type WidgetPropsType<T extends WidgetType> = (T extends WidgetType<infer P> ? P : {}) &
  IntrinsicProperties
/**
 * 节点Props类型重载
 */
export type VNodeProps<T extends VNodeType> = T extends AllNodeElementName
  ? NodeElement<T>
  : T extends WidgetType
    ? WidgetPropsType<T>
    : never
