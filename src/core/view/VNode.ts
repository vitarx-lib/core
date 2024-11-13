import { isFunction, isRecordObject, popProperty, Scope } from '../../index.js'
import { type ClassWidget } from './widget.js'
import type { FnWidget } from './fn-widget.js'
import type { ExcludeLifeCycleMethods } from './life-cycle.js'
import type {
  HtmlElementTagMap,
  HtmlElementTags,
  HtmlIntrinsicElements
} from './web-render/index.js'

/** 响应式元素引用标记 */
const RefElSymbol = Symbol('RefEl')
/** 文本节点标识符 */
const TextVNodeSymbol = Symbol('TextNode')
/** 片段组件标识符 */
export const Fragment: unique symbol = Symbol('Fragment')
/** 片段类型标识符 */
export type Fragment = typeof Fragment
/** 虚拟节点标识符 */
const VNodeSymbol = Symbol('VNode')

/** 唯一标识符 */
export type OnlyKey = string | number | bigint
// 辅助计算出元素类型
type ComputedRefElType<T> = T extends HtmlElementTags
  ? HtmlElementTagMap[T]
  : T extends Fragment
    ? VDocumentFragment
    : T extends FnWidget
      ? Record<string, any>
      : ExcludeLifeCycleMethods<T>
/** 引用元素类型 */
export type RefEl<T> = {
  value: ComputedRefElType<T> | null, readonly [RefElSymbol]: true
}
/**
 * 全局属性
 */
export interface IntrinsicAttributes {
  /**
   * 控制一个 `Component` 如何替换树中的另一个 `Component`。
   *
   * 在运行时，如果两个Component的`key`相同，则会更新已渲染的Component，否则会移除旧Component，然后插入新Component。
   *
   * 这在某些情况下很有用，例如，当您想重新排序列表时。
   *
   * 通常，作为另一个 Component 的唯一子项的 Component 不需要显式键。
   */
  key?: OnlyKey
  /**
   * 引用组件
   */
  ref?: RefEl<any>
}

/**
 * HTML 节点类型
 */
export type HtmlTag = HtmlElementTags
// 节点类型
export type VNodeType = HtmlTag | Fragment | ClassWidget | FnWidget
// 节点属性结构
export type VNodeProps<T> = (T extends HtmlElementTags
  ? HtmlIntrinsicElements[T]
  : T extends ClassWidget<infer P>
    ? P
    : T extends FnWidget<infer P>
      ? P
      : {}) &
  IntrinsicAttributes
/** 子节点类型 */
export type VNodeChild = VNode | TextVNode
/** 子节点列表 */
export type VNodeChildren = Array<VNodeChild>
/** HTML片段节点数组 */
export type VDocumentFragment = Array<Element | Text>
/** 真实的元素实例对象，片段节点为数组 */
export type VElement = Element | Text | VDocumentFragment

/** 文本节点，内部自动转换 */
export interface TextVNode {
  value: string
  el?: Text
  [TextVNodeSymbol]: true
}

/**
 * 虚拟Node
 *
 * - `type`: 节点类型
 * - `props`: 节点属性
 * - `key`: 节点唯一标识
 * - `ref`: 节点引用
 * - `el`: 节点元素实例
 * - `scope`: 作用域，内部创建，用于管理副作用
 * - `children`: 子节点列表，如果是函数小部件或类小部件，则此参数会覆盖到`props.children`
 */
export type VNode<T extends VNodeType = VNodeType> = {
  type: T
  props: VNodeProps<T>
  key?: OnlyKey
  ref?: RefEl<T>
  el?: VElement
  scope?: Scope
  children?: VNodeChildren
  [VNodeSymbol]: true
}
type Child = VNode | TextVNode | AnyPrimitive | Array<Child>
export type Children = Child[]
/**
 * 创建元素`VNode`
 *
 * 该方法是`createElement`的别名。
 *
 * @see createElement
 */
export function h<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null = null,
  ...children: Children
): VNode<T> {
  return createElement(type, props, ...children)
}

/**
 * 创建元素`VNode`
 *
 * @alias h
 * @param type - 节点类型
 * @param props - 节点属性
 * @param children - 子节点，如果是小部件类型则会写入到 `props.children`
 * @returns {VNode} - 虚拟节点
 */
export function createElement<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null = null,
  ...children: Children
): VNode<T> {
  if (!props) props = {} as any
  if (!isRecordObject(props)) {
    throw new TypeError(
      `[Vitarx]：createElement.props参数类型必须是Record(string,any)类型，给定${typeof props}`
    )
  }
  const vnode: VNode<T> = {
    [VNodeSymbol]: true,
    type,
    props: props
  }
  const key = popProperty(props, 'key')
  if (key) vnode.key = key
  const ref = popProperty(props, 'ref')
  if (isRefEl(ref)) vnode.ref = ref
  if (isFunction(type)) {
    if (children.length > 0) {
      // @ts-ignore
      props.children = children.length === 1 ? children[0] : children
    }
  } else {
    // 合并属性中的children
    if ('children' in props) {
      const attrChildren = popProperty(props, 'children')
      if (Array.isArray(attrChildren)) {
        children = [...attrChildren, ...children]
      } else {
        children.push(attrChildren as any)
      }
    }
    vnode.children = toVNodeChildren(children)
  }
  return vnode
}

/**
 * 转换子节点列表
 *
 * @param children
 */
function toVNodeChildren(children: Child[]): VNodeChildren {
  let childList: VNodeChildren = []

  function flatten(child: Child) {
    if (Array.isArray(child)) {
      child.forEach(item => flatten(item))
    } else {
      childList.push(
        isVNode(child)
          ? child
          : {
              value: String(child),
              [TextVNodeSymbol]: true
            }
      )
    }
  }

  flatten(children)
  return childList
}

/**
 * 判断是否为虚拟节点对象
 *
 * 注意：该方法仅判断是否为VNode对象，文本节点请使用`isTextVNode`方法判断
 *
 * @param obj
 */
export function isVNode(obj: any): obj is VNode {
  return obj?.[VNodeSymbol] === true
}

/**
 * 判断是否为文本节点
 *
 * @param obj
 */
export function isTextVNode(obj: any): obj is TextVNode {
  return obj?.[TextVNodeSymbol] === true
}

/**
 * 引用元素
 *
 * 会在widget或元素挂载到dom后自动赋值给该value
 */
export function refEl<T>(): RefEl<T> {
  return {
    value: null,
    [RefElSymbol]: true
  }
}

/**
 * 判断是否为引用元素
 *
 * @param obj
 */
export function isRefEl(obj: any): obj is RefEl<any> {
  return obj?.[RefElSymbol] === true
}

