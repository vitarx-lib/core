import type { RefSignal } from '@vitarx/responsive'
import type { AnyPrimitive } from '@vitarx/utils'
import { type ClassWidget, type FunctionWidget } from '../../widget/index.js'
import type {
  Comment as CommentType,
  Fragment as FragmentType,
  Text as TextType
} from '../node-symbol.js'
import type { ElementVNode, FragmentVNode, NoTagVNode, VNode, WidgetVNode } from '../nodes/index.js'
import type {
  AllNodeElementName,
  CommentNodeElementName,
  FragmentNodeElementName,
  IntrinsicNodeElementName,
  NodeElement,
  TextNodeElementName
} from './element.js'
import type { IntrinsicProperties } from './properties.js'

/**
 * 表示可以作为子节点的类型
 */
export type Child =
  | VNode
  | Exclude<AnyPrimitive, symbol>
  | RefSignal<VNode | Exclude<AnyPrimitive, symbol>>
  | Array<Child>
  | RefSignal<Child>

/**
 * 支持任意类型的子节点
 */
export type AnyChildren = Array<Child> | Child

/**
 * 小部件类型
 */
export type WidgetType<P extends Record<string, any> = any> = ClassWidget<P> | FunctionWidget<P>
/**
 * 虚拟节点类型
 */
export type VNodeType = AllNodeElementName | WidgetType | FragmentType | TextType | CommentType
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

/**
 * 节点实例类型重载
 */
export type VNodeInstance<T extends VNodeType> = T extends FragmentNodeElementName | FragmentType
  ? FragmentVNode
  : T extends TextNodeElementName | TextType
    ? NoTagVNode<TextNodeElementName>
    : T extends CommentNodeElementName | CommentType
      ? NoTagVNode<CommentNodeElementName>
      : T extends WidgetType
        ? WidgetVNode<T>
        : T extends IntrinsicNodeElementName
          ? ElementVNode<T>
          : VNode<T>

/**
 * 合并Props类型
 *
 * @param Input - 可选的属性对象，也就是组件可接收的属性类型
 * @param Default - 必填的属性对象，也就是组件的默认属性类型
 */
export type MergeProps<Input extends {}, Default extends {}> = Omit<Input, keyof Default> & {
  [P in Extract<keyof Default, keyof Input>]-?: Default[P] extends Exclude<Input[P], undefined>
    ? Exclude<Input[P], undefined>
    : Exclude<Input[P], undefined> | Default[P] // 强制指定的属性 K 为必填
} & Omit<Default, keyof Input>

/**
 * 挂载类型
 */
export type MountType = 'insertBefore' | 'insertAfter' | 'replace' | 'appendChild'
