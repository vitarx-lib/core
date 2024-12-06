import {
  __updateParentVNode,
  type CommentVNode,
  CommentVNodeSymbol,
  isFunction,
  isRecordObject,
  isRefEl,
  isVNode,
  popProperty
} from '../../index.js'
import type { RefEl, TextVNode, VNode, VNodeChildren, VNodeProps, VNodeType } from './type.js'
import { RefElSymbol, TextVNodeSymbol, VNodeSymbol } from './constant.js'

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
 * @param children - 子节点，如果是组件类型则会覆盖到 `props.children`
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
      `[Vitarx]：createVNode.props参数类型必须是Record(string,any)类型，给定${typeof props}`
    )
  }
  const vnode: VNode<T> = {
    [VNodeSymbol]: true,
    type,
    props,
    key: popProperty(props, 'key') || null,
    ref: null,
    children: [],
    el: null,
    instance: null,
    provide: null
  }
  const key = popProperty(props, 'key')
  if (key) vnode.key = key
  const ref = popProperty(props, 'ref')
  if (isRefEl(ref)) vnode.ref = ref
  if (isFunction(type)) {
    if (children.length > 0) {
      // @ts-ignore
      props.children = children.length === 1 ? children[0] : children
      children = []
    }
  } else if ('children' in props) {
    const attrChildren = popProperty(props, 'children' as any)
    if (Array.isArray(attrChildren)) {
      children = [...attrChildren, ...children]
    } else {
      children.push(attrChildren as any)
    }
  }
  vnode.children = toVNodeChildren(children, vnode)
  return vnode
}

export { createVNode as createElement }

/**
 * 创建文本节点`TextVNode`
 *
 * 开发者无需使用显示的声明文本节点，内部将非VNode节点内容转换为文本节点。
 *
 * 空的`<></>`片段节点内部会存在一个空的文本节点用于占位，它在窗口中是不可见的，但它在`DOM`树中真实存在，目的也只是为了保留位置信息。
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
 * 创建注释节点
 *
 * 暂未对外提供使用，后续可能会开放使用。
 *
 * @internal
 * @param value
 */
export function createCommentVNode(value: string): CommentVNode {
  return {
    value,
    el: null,
    [CommentVNodeSymbol]: true
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
      __updateParentVNode(vnode, parent)
    }
  }

  flatten(children)

  return childList
}

/**
 * 引用节点元素
 *
 * 会在`Widget`或`HTML标签`挂载到dom后自动赋值给`value`属性字段
 *
 * 如果是引用的是`Widget`，value则是`Widget`实例，其他是`HTMLElement`真实的元素实例
 */
export function refEl<T>(): RefEl<T> {
  return {
    value: null,
    [RefElSymbol]: true
  }
}
