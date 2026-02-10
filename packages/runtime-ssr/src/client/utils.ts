import {
  ElementView,
  FragmentView,
  type HostContainer,
  type HostElement,
  type HostElementTag,
  type HostFragment,
  type HostNode,
  type HostView,
  isListView,
  ListView,
  ViewKind
} from '@vitarx/runtime-core'
import { isArray } from '@vitarx/utils'
import type { DOMElement, DOMNode, DOMNodeList, NodeDescTag, NodeInfo } from '../shared/types.js'

/**
 * 解析DOM节点的类型和标签
 * @param el DOM节点对象
 * @returns - 返回包含节点类型和标签的对象，包含kind和tag两个属性
 */
function parseKindAndTag(el: DOMNode): Pick<NodeInfo, 'kind' | 'tag'> {
  // 判断节点类型是否为注释节点
  if (el.nodeType === Node.COMMENT_NODE) {
    return { kind: ViewKind.COMMENT, tag: 'comment-node' }
  } else if (el.nodeType === Node.TEXT_NODE) {
    return { kind: ViewKind.TEXT, tag: 'text-node' }
  } else if (el.nodeType === Node.ELEMENT_NODE) {
    const tagName = (el as Element).tagName.toLowerCase()
    return { kind: ViewKind.ELEMENT, tag: tagName as HostElementTag }
  }
  return { kind: -1 as ViewKind, tag: 'unknown' as any }
}

/**
 * 解析节点的类型，判断是否为Fragment或List类型
 * @param el - 需要解析的DOM节点
 * @returns  返回节点的类型，'Fragment'、'List' 或 false（如果不是这两种类型）
 */
function parseFragmentType(el: DOMNode): 'Fragment' | 'List' | false {
  let type: 'Fragment' | 'List' | false = false // 初始化类型为false
  // 检查节点是否为注释节点
  if (el.nodeType === Node.COMMENT_NODE) {
    // 检查注释节点的内容，判断是Fragment还是List类型的开始标记
    if (el.nodeValue === 'Fragment:start') {
      type = 'Fragment' // 设置类型为Fragment
    } else if (el.nodeValue === 'List:start') {
      type = 'List' // 设置类型为List
    }
  }
  return type // 返回解析得到的节点类型
}

/**
 * 获取指定索引的DOM节点，如果遇到Fragment片段则返回整个片段
 * @param el - HTML元素节点
 * @param index - 子节点的起始索引，默认为0
 * @returns {object} 返回一个对象，包含节点或节点数组以及下一个索引位置
 */
export function getFirstNode(el: DOMElement | DOMNodeList, index: number = 0): NodeInfo | null {
  const childNodes = isArray(el) ? el : (el.childNodes as unknown as DOMNodeList)
  const firstNode = childNodes?.[index]
  if (!firstNode) return null
  const fragmentType = parseFragmentType(firstNode)
  // 检查第一个节点是否是Fragment start注释
  if (fragmentType) {
    const fragment = [firstNode] // 初始化数组，包含起始注释节点
    let nestingFragment = 0
    // 遍历剩余节点，收集到Fragment end注释为止的所有节点
    for (let i = index + 1; i < childNodes.length; i++) {
      const node = childNodes[i]
      fragment.push(node as HostElement) // 将节点添加到数组中
      if (node.nodeType === Node.COMMENT_NODE && node.nodeValue === `${fragmentType}:start`) {
        nestingFragment++
        continue
      }
      // 如果找到Fragment end注释，停止收集
      if (node.nodeType === Node.COMMENT_NODE && node.nodeValue === `${fragmentType}:end`) {
        if (nestingFragment !== 0) {
          nestingFragment--
          continue
        }
        break
      }
    }
    // 返回Fragment节点数组，nextIndex为Fragment end元素的index+1
    return {
      el: fragment,
      kind: ViewKind.FRAGMENT,
      nextIndex: index + fragment.length,
      tag: `${fragmentType.toLowerCase() as 'list' | 'fragment'}-node`
    }
  } else {
    // 非Fragment节点，nextIndex为当前index+1
    return { el: firstNode, nextIndex: index + 1, ...parseKindAndTag(firstNode) }
  }
}

/**
 * 根据视图类型获取对应的宿主视图标签
 *
 * @param view - 输入的视图对象，可以是ListView或HostView类型
 * @returns 返回对应的节点描述标签，包括：
 *          - 'text-node' (文本节点)
 *          - 元素标签名 (元素节点)
 *          - 'fragment-node' (片段节点)
 *          - 'comment-node' (注释节点)
 *          - 'list-node' (列表节点)
 */
export function getHostViewTag(view: ListView | HostView): NodeDescTag {
  const kind = view.kind
  switch (view.kind) {
    case ViewKind.TEXT:
      return 'text-node'
    case ViewKind.ELEMENT:
      return view.tag
    case ViewKind.FRAGMENT:
      return 'fragment-node'
    case ViewKind.COMMENT:
      return 'comment-node'
    case ViewKind.LIST:
      return 'list-node'
    default:
      throw new Error(`Unknown view kind: ${String(kind)}`)
  }
}

/**
 * 计算 start 与 end 之间（**不包括 start/end**）的节点数量。
 *
 * @param start - 起始节点（通常是注释锚点）
 * @param end - 结束节点（通常是注释锚点）
 * @returns number - start 和 end 之间的节点数量（不包含 start/end）。strict=true 且 end 不存在时抛错。
 */
export function countNodesBetween(start: Node, end: Node): number {
  let count = 0
  let cur: Node | null = start.nextSibling

  while (cur) {
    // 找到 end，返回计数（不包含 end）
    if (cur === end) return count
    count++
    cur = cur.nextSibling
  }
  return count
}

/**
 * 向容器中添加子元素
 * @param container - 目标容器，可以是单个元素或元素数组
 * @param el - 要添加的子元素
 */
export function appendChild(container: DOMElement | DOMNodeList, el: HostNode): void {
  // 判断容器是否为数组类型
  if (isArray(container)) {
    // 获取数组最后一个元素
    const end = container.at(-1)!
    // 检查最后一个元素是否有下一个兄弟节点
    if (end.nextSibling) {
      // 如果有下一个兄弟节点，则在该兄弟节点前插入新元素
      end.nextSibling.parentElement!.insertBefore(el, end.nextSibling)
    } else {
      // 如果没有下一个兄弟节点，则直接添加为容器的子元素
      end.parentElement!.appendChild(el)
    }
  } else {
    // 如果容器不是数组，直接调用appendChild方法添加元素
    container.appendChild(el)
  }
}

/** 移除 container 下指定 index 之后的所有多余节点 */
export function cleanupExtraDom(view: ElementView): void {
  const lastVNode = view.children.at(-1)
  const container = view.node!
  if (!lastVNode) {
    container.innerHTML = ''
    return
  }
  // 获取最后一个子节点的真实 DOM
  let lastChildEl = lastVNode.node!
  if (lastChildEl.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    lastChildEl = (lastChildEl as HostFragment).$endAnchor
  }

  // 删除 lastChildEl 之后到 container 末尾的所有节点
  const start = lastChildEl.nextSibling
  if (start) {
    const range = document.createRange()
    range.setStartBefore(start)
    range.setEndAfter(container.lastChild!)
    range.deleteContents()
  }
}

/** 清除 Fragment 范围中过多的真实 DOM */
export function cleanupFragmentRange(view: FragmentView | ListView): void {
  const start = view.node!.$startAnchor
  const end = view.node!.$endAnchor
  const isList = isListView(view)
  const length = isList ? view.length : view.children.length
  // 如果没有子节点，则清空 start/end 之间的所有节点
  if (!length) {
    const range = document.createRange()
    range.setStartAfter(start)
    range.setEndBefore(end)
    range.deleteContents()
    return
  }

  const firstView = isList ? view.first! : view.children.at(-1)!
  // 获取最后一个子节点对应的真实 DOM
  let lastChildEl = firstView.node!
  if (lastChildEl.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    lastChildEl = (lastChildEl as HostFragment).$endAnchor
  }

  // 删除 lastChildEl 之后到 end 之间的所有节点
  if (lastChildEl.nextSibling) {
    const range = document.createRange()
    range.setStartAfter(lastChildEl)
    range.setEndBefore(end)
    range.deleteContents()
  }
}

/**
 * 解析容器参数，将其转换为DOM元素
 * @param container - 可以是选择器字符串、DOM元素或宿主元素数组
 * @returns {Element} 返回解析后的DOM元素
 * @throws {TypeError} 当container无法解析为有效DOM元素时抛出错误
 */
export function resolveContainer(container: HostContainer | string): Element {
  const el = typeof container === 'string' ? document.body.querySelector(container) : container // 如果是字符串则查询DOM，否则直接使用原参数
  if (el instanceof Element) {
    return el // 如果是有效的DOM元素则直接返回
  } else {
    throw new TypeError('[resolveContainer]: container must be a selector string or Element') // 否则抛出错误
  }
}
