import type { RefSignal } from '@vitarx/responsive'
import { isRefSignal } from '@vitarx/responsive'
import { isFunction, isRecordObject, isString, popProperty } from '@vitarx/utils/src/index'
import type { ClassProperties, NoTagElements } from '../../renderer/index'
import { cssClassValueToArray, mergeCssClass, mergeCssStyle } from '../../renderer/utils'
import type { NoTagElementVNode, UniqueKey, VNode, VNodePropsType, VNodeType } from '../types'
import { VNodeSymbol } from './constant'
import { addParentVNodeMapping } from './relationships'
import { isNoTagVNodeType, isValidVNodeType, isVNode } from './type-guards'

/**
 * 表示可以作为子节点的类型
 */
export type Child = VNode | AnyPrimitive | RefSignal<VNode | AnyPrimitive> | Array<Child>

/**
 * 表示子节点数组
 */
export type Children = Array<Child>

/**
 * 处理节点属性，包括v-bind、样式和类名合并等
 *
 * @private
 * @param {Exclude<VNode, NoTagElementVNode>} vnode - 要处理属性的节点
 * @returns {void}
 */
function propsHandler(vnode: Exclude<VNode, NoTagElementVNode>): void {
  const vBind = popProperty(vnode.props, 'v-bind')
  let attrs: Record<string, any> = vBind
  let exclude: string[] = []
  if (Array.isArray(vBind)) {
    attrs = vBind[0]
    exclude = vBind[1] || []
  }
  // 如果属性对象存在，则遍历合并属性
  if (isRecordObject(attrs)) {
    for (const key in attrs) {
      // 如果排除列表中包含当前属性或属性是`children`，则跳过
      if (exclude.includes(key) || key === 'children') continue
      if (key in vnode.props) {
        // 合并样式
        if (key === 'style') {
          vnode.props[key] = mergeCssStyle(vnode.props[key], attrs[key])
          continue
        }
        if (key === 'class' || key === 'className' || key === 'classname') {
          vnode.props[key] = mergeCssClass(vnode.props[key], attrs[key])
          continue
        }
      }
      vnode.props[key] = attrs[key]
    }
  }
  // 如果是字符串标签，格式化一次value，使值Ref对象能够被依赖跟踪
  if (isString(vnode.type)) {
    for (const prop in vnode.props) {
      let value = vnode.props[prop]
      while (isRefSignal(value)) value = value.value
      // 将格式化过后的值赋值回去
      vnode.props[prop] = value
    }
    // 处理 class 属性
    let cssClass: ClassProperties =
      'class' in vnode.props ? cssClassValueToArray(vnode.props.class) : []
    if ('className' in vnode.props) {
      cssClass = mergeCssClass(cssClass, vnode.props.className)
      delete vnode.props.className
    }
    if ('classname' in vnode.props) {
      cssClass = mergeCssClass(cssClass, vnode.props.classname)
      delete vnode.props.classname
    }
    // 如果合并后的 class 存在，赋值给 newProps.class
    if (cssClass.length > 0) vnode.props.class = cssClass
  }
}

/**
 * 将嵌套的子节点列表平铺展开并规范化
 *
 * @private
 * @param {Children | Child} child - 子节点或子节点列表
 * @param {VNode} parent - 父节点
 * @returns {VNode[]} 平铺展开并规范化后的子节点数组
 */
function formatChildren(child: Children | Child, parent: VNode): VNode[] {
  const childList: VNode[] = []
  // 用于检测重复key的集合
  const keySet = new Set<UniqueKey>()
  if (Array.isArray(child)) {
    child.forEach(item => {
      const itemChildren = formatChildren(item, parent)
      childList.push(...itemChildren)
    })
  } else {
    let vnode: VNode
    if (isVNode(child)) {
      vnode = child
      // 检查key是否重复
      if ('key' in vnode && vnode.key) {
        if (keySet.has(vnode.key)) {
          console.warn(
            `[Vitarx.VNode][WARN]：Duplicate key: ${String(vnode.key)} detected, which can cause rendering errors or performance issues。`
          )
        } else {
          keySet.add(vnode.key)
        }
      }
    } else if ([false, undefined, null].includes(child as any)) {
      vnode = createNoTagVNode('comment-node', String(child))
    } else {
      vnode = createNoTagVNode('text-node', String(child))
    }
    childList.push(vnode)
    addParentVNodeMapping(vnode, parent)
  }
  return childList
}

/**
 * 创建无标签VNode（文本节点或注释节点）
 *
 * @template T - 无标签元素类型
 * @param {T} type - 节点类型（'text-node'或'comment-node'）
 * @param {string} value - 节点内容
 * @returns {NoTagElementVNode<T>} 创建的无标签VNode
 */
export function createNoTagVNode<T extends NoTagElements>(
  type: T,
  value: string
): NoTagElementVNode<T> {
  return {
    [VNodeSymbol]: true,
    type: type,
    value
  }
}

/**
 * 创建VNode节点
 *
 * @template T - VNode类型
 * @param {T} type - 节点类型（标签名、组件函数或Fragment）
 * @param {Record<string, any> | null} props - 节点属性
 * @param {...Child[]} children - 子节点列表
 * @returns {VNode<T>} 创建的VNode节点
 * @throws {Error} 当提供的类型无效时抛出错误
 */
export function createVNode<T extends VNodeType>(
  type: T,
  props: VNodePropsType<T> | null = null,
  ...children: Child[]
): VNode<T> {
  if (!isValidVNodeType(type)) {
    throw new Error(`Invalid VNode type: ${type}`)
  }
  if (isNoTagVNodeType(type)) {
    return createNoTagVNode(type, String(children[0])) as VNode<T>
  }
  // 将props合并为一个新对象
  const newProps = { ...(props as Record<string, any>) }
  // 提取并处理 key 和 ref
  const key = popProperty(newProps, 'key')
  const ref_el = popProperty(newProps, 'ref')
  const vnode = {
    [VNodeSymbol]: true,
    type,
    key,
    ref: ref_el,
    props: newProps,
    children: []
  } as unknown as VNode<Exclude<T, NoTagElements>>
  // 处理函数组件，合并 children 到 props 中
  if (isFunction(type)) {
    if (children.length > 0) {
      newProps.children = children.length === 1 ? children[0] : children
      children = []
    }
  } else if ('children' in newProps) {
    // 如果props中有children属性，合并到children
    const attrChildren = popProperty(newProps, 'children')
    if (attrChildren) {
      children = Array.isArray(attrChildren)
        ? [...attrChildren, ...children]
        : [attrChildren, ...children]
    }
  }
  propsHandler(vnode)
  // 格式化children
  vnode.children = formatChildren(children, vnode)
  return vnode
}
