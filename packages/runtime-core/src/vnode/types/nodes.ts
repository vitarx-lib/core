import type { RefSignal } from '@vitarx/responsive'
import { Widget, type WidgetType } from '../../widget/index'
import { type Fragment, type RefEl, VNodeSymbol } from '../core/index'
import type { UniqueKey } from './attributes'
import type {
  AllNodeElementName,
  IntrinsicNodeElementName,
  NodeElement,
  NoTagNodeElementName,
  RuntimeElement
} from './element'

/**
 * 支持的VNode类型
 *
 * - IntrinsicElementName - 内置元素类型
 * - Fragment - 片段类型
 * - Function - 函数类型
 */
export type VNodeType = AllNodeElementName | WidgetType

/**
 * 节点Props类型重载
 */
export type VNodePropsType<T extends VNodeType> = T extends AllNodeElementName
  ? NodeElement<T>
  : T extends WidgetType<infer P>
    ? P
    : never

export interface BaseVNode<T extends VNodeType = VNodeType> {
  /**
   * VNode对象标识符
   */
  readonly [VNodeSymbol]: true
  /**
   * 元素属性
   */
  readonly props: VNodePropsType<T> | null
  readonly type: T
  /**
   * 唯一标识符
   */
  readonly key: UniqueKey | null
  /**
   * 引用
   */
  readonly ref: RefEl<T> | null
  /**
   * 仅在渲染过后才存在
   */
  el?: T extends AllNodeElementName ? RuntimeElement<T> : RuntimeElement
  readonly children: VNode[]
}

/**
 * 特殊元素节点
 */
export type NoTagVNode<T extends NoTagNodeElementName = NoTagNodeElementName> = Pick<
  BaseVNode<T>,
  'el' | VNodeSymbol | 'type'
> & {
  value: string | RefSignal<string>
}

/**
 * 纯文本节点
 */
export interface TextNode extends NoTagVNode<'text-node'> {}

/**
 * 注释节点
 */
export interface CommentVNode extends NoTagVNode<'comment-node'> {}

/**
 * 片段节点
 */
export interface FragmentVNode extends BaseVNode<Fragment> {}

/**
 * 普通元素节点
 */
export interface ElementVNode<T extends IntrinsicNodeElementName = IntrinsicNodeElementName>
  extends BaseVNode<T> {}

/**
 * 组件节点
 */
export interface WidgetVNode<T extends WidgetType = any> extends BaseVNode<T> {
  /**
   * 组件实例
   */
  instance?: Widget
  /**
   * 向下提供的数据
   */
  provide?: Record<string | symbol, any>
  /**
   * HMR状态，开发时由`@vitarx/vite-bundler`注入
   */
  __$HMR_STATE$__?: Record<string, any>
}

/**
 * VNode对象
 *
 * @template T - VNode类型
 * @internal 所有属性都是内部进行管理，开发者请勿随意修改此对象！
 */
export type VNode<T extends VNodeType = VNodeType> = T extends NoTagNodeElementName
  ? NoTagVNode<T>
  : T extends Fragment
    ? FragmentVNode
    : T extends WidgetType
      ? WidgetVNode<T>
      : T extends IntrinsicNodeElementName
        ? ElementVNode<T>
        : never

const d: VNode = {} as WidgetVNode
console.debug('VNode', d)
