import type { RefSignal } from '@vitarx/responsive'
import type { AnyPrimitive } from '@vitarx/utils/src/index'
import { Widget } from '../../widget/index'
import { VNode } from '../nodes'
import type { AllNodeElementName, NodeElement } from './element'

/**
 * 表示可以作为子节点的类型
 */
export type Child =
  | VNode
  | Exclude<AnyPrimitive, symbol>
  | RefSignal<VNode | Exclude<AnyPrimitive, symbol>>
  | Array<Child>
/**
 * 视图构建器类型
 */
type BuildVNode = () => VNode | null
/**
 * 类小部件构造器类型
 */
export type ClassWidget<P extends Record<string, any> = any> = new (props: P) => Widget
/**
 * 函数小部件有效地返回值
 *
 * - `null`：不渲染任何内容
 * - `VNode`：直接返回虚拟节点
 * - `Promise<null>`：异步返回null
 * - `Promise<VNode>`：异步返回虚拟节点
 * - `Promise<()=>VNode|null>`：异步返回视图构建器
 * - `Promise<{ default: WidgetType }>`：异步返回EsModule对象，必须有默认导出
 */
export type ValidFunctionWidgetReturnValue =
  | VNode
  | null
  | BuildVNode
  | Promise<VNode | null | BuildVNode>
  | Promise<{ default: WidgetType }>
/**
 * 函数小部件类型
 */
export type FunctionWidget<P extends Record<string, any> = any> = (
  props: P
) => ValidFunctionWidgetReturnValue
/**
 * 小部件类型
 */
export type WidgetType<P extends Record<string, any> = any> = ClassWidget<P> | FunctionWidget<P>
/**
 * 虚拟节点类型
 */
export type VNodeType = AllNodeElementName | WidgetType
/**
 * 节点Props类型重载
 */
export type VNodeProps<T extends VNodeType> = T extends AllNodeElementName
  ? NodeElement<T>
  : T extends WidgetType<infer P>
    ? P
    : never
