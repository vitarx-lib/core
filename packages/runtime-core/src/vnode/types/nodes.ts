import type {
  ExcludeNoTagElements,
  IntrinsicElementNames,
  IntrinsicElements,
  NoTagElements,
  RuntimeElement,
  RuntimeNoTagElement
} from '../../renderer/index'
import { Widget } from '../../widget/index'
import { type Fragment, type RefEl, VNodeSymbol } from '../core/index'
import type { UniqueKey } from './attributes'

/**
 * 支持的VNode类型
 *
 * - IntrinsicElementName - 内置元素类型
 * - Fragment - 片段类型
 * - Function - 函数类型
 */
export type VNodeType = IntrinsicElementNames | Fragment | Function

/**
 * HTML节点Props类型重载
 */
/**
 * 节点Props类型重载
 */
export type VNodePropsType<T extends VNodeType> = T extends IntrinsicElementNames
  ? IntrinsicElements[T]
  : T extends Function
    ? any
    : {}

export interface BaseVNode<T extends VNodeType = VNodeType> {
  /**
   * VNode对象标识符
   */
  readonly [VNodeSymbol]: true
  readonly type: T
  readonly props: VNodePropsType<T> | null
  /**
   * 唯一标识符
   */
  readonly key: UniqueKey | null
  /**
   * 引用
   */
  ref: RefEl<T> | null
  /**
   * 仅在渲染过后才存在
   */
  el?: T extends IntrinsicElementNames ? RuntimeElement<T> : RuntimeNoTagElement
  children: VNode[]
}

/**
 * 特殊元素节点
 */
export type NoTagElementVNode<T extends NoTagElements = NoTagElements> = Pick<
  BaseVNode<T>,
  'el' | VNodeSymbol | 'type'
> & {
  value: string
}

/**
 * 纯文本节点
 */
export interface TextNode extends NoTagElementVNode<'text-node'> {}

/**
 * 注释节点
 */
export interface CommentNode extends NoTagElementVNode<'comment-node'> {}

/**
 * 片段节点
 */
export interface FragmentNode extends BaseVNode<Fragment> {}

/**
 * 普通元素节点
 */
export interface ElementVNode<T extends ExcludeNoTagElements = ExcludeNoTagElements>
  extends BaseVNode<T> {}

/**
 * 组件节点
 */
export interface WidgetVNode<T extends Function = Function> extends BaseVNode<T> {
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
export type VNode<T extends VNodeType = VNodeType> = T extends NoTagElements
  ? NoTagElementVNode<T>
  : T extends Fragment
    ? FragmentNode
    : T extends Function
      ? WidgetVNode<T>
      : ElementVNode
