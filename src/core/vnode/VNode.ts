// noinspection JSUnusedGlobalSymbols

import {
  type ChildVNode,
  type CommentVNode,
  type IntrinsicAttributes,
  isRefEl,
  isVNode,
  type RefEl,
  type TextVNode,
  type VNode,
  type VNodeChildren,
  type VNodePropsType,
  type VNodeType
} from './types.js'
import {
  CommentVNodeSymbol,
  Fragment,
  RefElSymbol,
  TextVNodeSymbol,
  VNodeSymbol
} from './constant.js'
import {
  isFunction,
  isRecordObject,
  isString,
  mergeCssClass,
  mergeCssStyle,
  popProperty
} from '../../utils/index.js'
import { updateParentVNodeMapping } from './manager.js'
import { isSimpleWidget } from '../widget/index.js'
import { isValueProxy, type ValueProxy } from '../responsive/index.js'
import type { HTMLClassProperties } from '../renderer/web-runtime-dom/index.js'

// 子元素类型
type Child =
  | VNode
  | TextVNode
  | CommentVNode
  | AnyPrimitive
  | ValueProxy<VNode | TextVNode | CommentVNode | AnyPrimitive>
  | Array<Child>

// 虚拟节点数组
type Children = Child[]
// 检测虚拟节点类型
const validVNodeType = (type: any): type is VNodeType =>
  typeof type === 'string' || isFunction(type) || type === Fragment

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
  // 验证虚拟节点类型
  if (!validVNodeType(type)) {
    throw new Error(`[Vitarx.createVNode][ERROR]：Invalid VNode type ${typeof type}`)
  }

  // 将props合并为一个新对象
  const newProps = { ...props } as Record<string, any> & IntrinsicAttributes

  // 处理函数组件，合并 children 到 props 中
  if (isFunction(type)) {
    if (children.length > 0) {
      newProps.children = children.length === 1 ? children[0] : children
      children = []
    }
  } else if ('children' in newProps) {
    // 如果props中有children属性，合并到children
    const attrChildren = popProperty(newProps, 'children')
    children = Array.isArray(attrChildren)
      ? [...attrChildren, ...children]
      : [attrChildren, ...children]
  }

  // 提取并处理 key 和 ref
  const key = popProperty(newProps, 'key')
  const ref_el = popProperty(newProps, 'ref')

  // 处理绑定属性
  handlerBindAttrs(newProps)

  // 处理 class 相关属性，兼容 className, class 和 classname
  if (isString(type)) {
    const cssProps = ['className', 'class', 'classname']
    let cssClass: HTMLClassProperties = []

    // 合并所有相关的 class 属性
    cssProps.forEach(prop => {
      if (prop in newProps) {
        cssClass = mergeCssClass(cssClass, newProps[prop])
        delete newProps[prop]
      }
    })

    // 如果合并后的 class 存在，赋值给 newProps.class
    if (cssClass.length > 0) newProps.class = cssClass
  }

  // 如果是简单组件，调用构造函数并返回结果
  if (isSimpleWidget(type)) {
    const simpleVnode = type(newProps) as VNode<T>
    if (key && simpleVnode.key === undefined) {
      simpleVnode.key = key
    }
    if (isRefEl(ref_el)) {
      if (isRefEl(simpleVnode.ref)) {
        ref_el.value = () => simpleVnode.ref!.value
      } else {
        simpleVnode.ref = ref_el
      }
    }
    return simpleVnode
  }

  // 创建虚拟节点
  const vnode: VNode = {
    [VNodeSymbol]: true,
    type,
    props: newProps,
    key,
    ref: ref_el,
    children: []
  }
  const childList: VNodeChildren = []
  formatChildren(children, childList, vnode)
  // 格式化children
  vnode.children = childList
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
      if (key === 'class' || key === 'className' || key === 'classname') {
        props[key] = mergeCssClass(props[key], attrs[key])
      }
    } else {
      props[key] = attrs[key]
    }
  }
}

/**
 * 将循环嵌套的节点列表平铺展开
 *
 * @param child
 * @param childList
 * @param parent
 */
function formatChildren(child: Child, childList: VNodeChildren, parent: VNode) {
  while (isValueProxy(child)) {
    child = child.value
  }
  if (Array.isArray(child)) {
    child.forEach(item => formatChildren(item, childList, parent))
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
