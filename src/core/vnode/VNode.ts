// noinspection JSUnusedGlobalSymbols

import {
  type ChildVNode,
  type CommentVNode,
  type IntrinsicAttributes,
  isVNode,
  type RefEl,
  type TextVNode,
  type VNode,
  type VNodeChildren,
  type VNodePropsType,
  type VNodeType
} from './type.js'
import { CommentVNodeSymbol, RefElSymbol, TextVNodeSymbol, VNodeSymbol } from './constant.js'
import {
  isFunction,
  isRecordObject,
  mergeCssClass,
  mergeCssStyle,
  popProperty
} from '../../utils/index.js'
import { updateParentVNodeMapping } from './relational.js'

// 子元素类型
type Child = VNode | TextVNode | CommentVNode | AnyPrimitive | Array<Child>

// 虚拟节点数组
type Children = Child[]

/**
 * 创建一个虚拟节点（VNode）
 *
 * 此函数用于创建并返回一个虚拟节点对象它接受节点类型、属性和子节点作为参数
 * 虚拟节点是对DOM节点的轻量级表示，用于描述应该渲染到UI中的元素
 * 通过合并属性、处理key和ref属性、以及格式化子节点，此函数准备了一个可以用于后续渲染流程的虚拟节点对象
 *
 * @alias createElement
 * @template T - 期望创建的节点类型
 * @param {T} type - 虚拟节点的类型，可以是字符串（HTML标签）、函数组件或类组件、片段类型
 * @param {VNodePropsType<T> | null} props - 虚拟节点的属性，可以是任意对象，允许为null
 * @param {...Children} children - 虚拟节点的子节点，可以是任意数量的子节点
 * @returns {VNode} 返回一个虚拟节点对象
 */
export function createVNode<T extends VNodeType>(
  type: T,
  props: VNodePropsType<T> | null = null,
  ...children: Children
): VNode<T> {
  // 将props合并为一个新对象
  const newProps = Object.assign({}, props || {}) as Record<string, any> & IntrinsicAttributes
  // 创建虚拟节点
  const vnode: VNode = {
    [VNodeSymbol]: true,
    type,
    props: newProps,
    key: popProperty(newProps, 'key'),
    ref: popProperty(newProps, 'ref'),
    children: []
  }
  // 如果type是一个函数，则将children属性添加到props中，并将children置为空
  if (isFunction(type)) {
    if (children.length > 0) {
      newProps.children = children.length === 1 ? children[0] : children
      children = []
    }
  } else if ('children' in newProps) {
    // 如果props中有children属性，则将其添加到children中
    const attrChildren = popProperty(newProps, 'children')
    if (Array.isArray(attrChildren)) {
      children = [...attrChildren, ...children]
    } else {
      children.push(attrChildren)
    }
  }
  // 格式化children
  vnode.children = formatChildren(children, vnode)
  handlerBindAttrs(newProps)
  return vnode as VNode<T>
}

export { createVNode as createElement }

/**
 * 处理绑定属性
 *
 * @param props
 */
function handlerBindAttrs(props: Record<string, any>): void {
  const vBind = popProperty(props, 'v-bind')
  if (!vBind) return
  let attrs: Record<string, any> = vBind
  let exclude: string[] = []
  if (Array.isArray(vBind)) {
    attrs = vBind[0]
    exclude = vBind[1] || []
  }
  if (!isRecordObject(attrs)) return
  for (const key in attrs) {
    // 如果排除列表中包含当前属性或属性是`children`，则跳过
    if (exclude.includes(key) || key === 'children') continue
    if (key in props) {
      if (key === 'style') {
        props[key] = mergeCssStyle(props[key], attrs[key])
        continue
      }
      if (key === 'class' || key === 'className') {
        props[key] = mergeCssClass(props[key], attrs[key])
      }
    } else {
      props[key] = attrs[key]
    }
  }
}

/**
 * 创建文本节点`TextVNode`
 *
 * 开发者无需使用显示的声明文本节点，内部将非VNode节点内容转换为文本节点，`null,undefined,false`会被转换为`CommentVNode`。
 *
 * @param {any} value - 任意值，非字符串值会自动使用`String(value)`强制转换为字符串。
 */
export function createTextVNode(value: any): TextVNode {
  return {
    value: String(value),
    el: undefined,
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
export function createCommentVNode(value: any): CommentVNode {
  return {
    value: String(value),
    el: undefined,
    [CommentVNodeSymbol]: true
  }
}

/**
 * 转换子节点列表
 *
 * @param children
 * @param parent
 */
function formatChildren(children: Child[], parent: VNode): VNodeChildren {
  let childList: VNodeChildren = []
  function flatten(child: Child) {
    if (Array.isArray(child)) {
      child.forEach(item => flatten(item))
    } else {
      let vnode: ChildVNode
      if (isVNode(child)) {
        vnode = child
      } else if ([false, undefined, null].includes(child as any)) {
        vnode = createCommentVNode(child)
      } else {
        vnode = createTextVNode(child)
      }
      childList.push(vnode)
      updateParentVNodeMapping(vnode, parent)
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
