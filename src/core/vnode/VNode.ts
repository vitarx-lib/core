import {
  type HtmlElementTagMap,
  type HtmlIntrinsicElements,
  type HtmlTags,
  isFunction,
  isRecordObject,
  popProperty,
  type VDocumentFragment,
  type VElement
} from '../../index.js'
import { type ClassWidgetConstructor, type FnWidgetConstructor, Widget } from '../widget/index.js'
import type { ExcludeWidgetIntrinsicKeywords } from '../widget/constant.js'

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
export type OnlyKey = string | number | bigint | symbol

// 辅助计算出元素类型
type ComputedRefElType<T> = T extends HtmlTags
  ? HtmlElementTagMap[T]
  : T extends Fragment
    ? VDocumentFragment
    : ExcludeWidgetIntrinsicKeywords<T>

/** 引用元素类型 */
export type RefEl<T> = {
  value: ComputedRefElType<T> | null
  readonly [RefElSymbol]: true
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

// 节点类型
export type VNodeType = FnWidgetConstructor | ClassWidgetConstructor | Fragment | HtmlTags
// 节点属性结构
export type VNodeProps<T> = (T extends HtmlTags
  ? HtmlIntrinsicElements[T]
  : T extends ClassWidgetConstructor<infer P>
    ? P
    : T extends FnWidgetConstructor<infer P>
      ? P
      : {}) &
  IntrinsicAttributes

/** 子节点类型 */
export type VNodeChild = VNode | TextVNode

/** 子节点列表 */
export type VNodeChildren = Array<VNodeChild>

/** 文本节点，内部自动转换 */
export interface TextVNode {
  value: string
  el: Text | null
  [TextVNodeSymbol]: true
}

/**
 * 虚拟Node
 *
 * - `type`: 节点类型
 * - `props`: 节点属性
 * - `children`: 子节点列表，如果是函数小部件或类小部件则写入到`props.children`
 * - `key`: 节点唯一标识
 * - `ref`: 节点引用
 * - `el`: 节点元素实例
 * - `instance`: 仅用于函数或类小部件，表示小部件实例
 * - `provide`: 小部件提供的数据
 */
export type VNode<T extends VNodeType = VNodeType> = {
  type: T
  props: VNodeProps<T>
  children: VNodeChildren | null
  key: OnlyKey | null
  ref: RefEl<T> | null
  el: VElement | null
  instance?: Widget
  provide?: Record<string | symbol, any>
  [VNodeSymbol]: true
}

// 子元素类型
type Child = VNode | TextVNode | AnyPrimitive | Array<Child>

// 虚拟节点数组
type Children = Child[]

/**
 * 创建元素`VNode`
 *
 * @alias createElement
 * @template T - 节点类型
 * @param type - 节点类型
 * @param props - 节点属性
 * @param children - 子节点，如果是小部件类型则会写入到 `props.children`
 * @returns {VNode} - 虚拟节点
 */
export function createVNode<T extends VNodeType>(
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
    props,
    key: popProperty(props, 'key') || null,
    ref: null,
    el: null,
    children: null
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
  } else if ('children' in props) {
    const attrChildren = popProperty(props, 'children')
    if (Array.isArray(attrChildren)) {
      children = [...attrChildren, ...children]
    } else {
      children.push(attrChildren as any)
    }
    vnode.children = toVNodeChildren(children, vnode)
  }
  return vnode
}

export { createVNode as createElement }

/**
 * 创建特殊，文本节点`VNode`
 *
 * @param {any} value - 任意值，非字符串值会自动使用`String(value)`强制转换为字符串。
 * @param {boolean} notShowNullable - 自动转换`null`、`false`、`undefined`为空字符串
 */
export function createTextVNode(value: any, notShowNullable: boolean = true): TextVNode {
  if (notShowNullable && [false, undefined, null].includes(value)) value = ''
  return {
    value: typeof value === 'string' ? value : String(value),
    el: null,
    [TextVNodeSymbol]: true
  }
}

/**
 * 转换子节点列表
 *
 * @param children
 * @param parent
 */
function toVNodeChildren(children: Child[], parent: VNode): VNodeChildren {
  let childList: VNodeChildren = []
  function flatten(child: Child) {
    if (Array.isArray(child)) {
      child.forEach(item => flatten(item))
    } else {
      const vnode: VNode | TextVNode = isVNode(child) ? child : createTextVNode(child)
      childList.push(vnode)
      __ParentMapping__.set(vnode, parent)
    }
  }

  flatten(children)

  return childList
}

// VNode的父节点映射关系缓存
const __ParentMapping__ = new WeakMap<VNode | TextVNode, VNode>()

/**
 * 获取节点的父节点
 *
 * @returns {VNode|undefined} - 如果存在父节点则返回父节点的VNode对象
 * @param vnode - 自身的虚拟节点对象
 */
export function getParentVNode(vnode: VNode | TextVNode): VNode | undefined {
  return __ParentMapping__.get(vnode)
}

/**
 * 更新父节点映射
 *
 * 该方法提供给框架内部逻辑调用，开发者谨慎调用本方法。
 *
 * @param vnode - 虚拟节点对象
 * @param parent - 父节点
 */
export function __updateParentVNode(vnode: VNode | TextVNode, parent: VNode): void {
  __ParentMapping__.set(vnode, parent)
}

/**
 * ## `UI`构建器。
 *
 * > 注意：在类组件中不要使用`build`函数，类中的build方法就是构建器。
 *
 * 主要作用是优化TSX类型校验。
 *
 * 代码块中的顶级return语句如果是jsx语法，则会被自动添加箭头函数，使其成为一个UI构造器。
 *
 * 如果你的代码不是位于函数的一级块中，或你返回的是一个三元运算等不被支持自动优化的情况，请使用`build`函数包裹。
 *
 * 如果你没有使用tsx，则可以直接使用 `return () => <div>...</div>` 这样的语法。
 *
 * ```tsx
 *
 * // 下面的两个return语句的效果是一致的
 * // 它们的不同之处是在tsx文件中返回箭头函数用于构建ui会导致类型错误，所以在tsx文件中需要使用build包裹
 * return build(() => state ? <div>真</div> : <div>假</div>)
 * return () => state ? <div>真</div> : <div>假</div>
 * ```
 *
 * @param vnode - 虚拟节点对象或闭包函数返回虚拟节点对象
 */
export function build(vnode: VNode | (() => VNode)): VNode {
  if (typeof vnode === 'function') return vnode as unknown as VNode
  return (() => vnode) as unknown as VNode
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
