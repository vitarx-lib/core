import {
  COMMENT_NODE_TYPE,
  FRAGMENT_NODE_TYPE,
  type FragmentNode,
  type HostElements,
  type HostFragmentElement,
  type HostNodeElements,
  type HostNodeType,
  isVoidTag,
  NodeKind,
  type RegularElementNode,
  type RegularElementNodeType,
  TEXT_NODE_TYPE
} from '@vitarx/runtime-core'
import { isArray } from '@vitarx/utils'

interface FirstNode {
  el: HostElements | HostElements[]
  nextIndex: number
  kind: NodeKind
  tag: HostNodeType
}

function elToKind(el: HostElements): { kind: NodeKind; tag: HostNodeType } {
  if (el.nodeType === Node.COMMENT_NODE) {
    return { kind: NodeKind.COMMENT, tag: COMMENT_NODE_TYPE }
  } else if (el.nodeType === Node.TEXT_NODE) {
    return { kind: NodeKind.TEXT, tag: TEXT_NODE_TYPE }
  } else if (el.nodeType === Node.ELEMENT_NODE) {
    const tagName = (el as Element).tagName.toLowerCase()
    if (isVoidTag(tagName)) {
      return { kind: NodeKind.VOID_ELEMENT, tag: tagName }
    }
    return { kind: NodeKind.REGULAR_ELEMENT, tag: tagName as RegularElementNodeType }
  } else if (el.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    return { kind: NodeKind.FRAGMENT, tag: FRAGMENT_NODE_TYPE }
  }
  return { kind: -1 as NodeKind, tag: 'unknown' as HostNodeType }
}
/**
 * 获取指定索引的DOM节点，如果遇到Fragment片段则返回整个片段
 * @param el - HTML元素节点
 * @param index - 子节点的起始索引，默认为0
 * @returns {object} 返回一个对象，包含节点或节点数组以及下一个索引位置
 */
export function getFirstDomNode(el: Element | HostElements[], index: number = 0): FirstNode | null {
  const childNodes = isArray(el) ? el : el.childNodes
  const firstNode = childNodes[index] as HostElements // 获取指定索引的子节点
  if (!firstNode) return null
  // 检查第一个节点是否是Fragment start注释
  if (firstNode.nodeType === Node.COMMENT_NODE && firstNode.nodeValue === 'Fragment start') {
    const arr = [firstNode] as unknown as HostElements[] // 初始化数组，包含起始注释节点
    let endIndex = index // 记录Fragment end注释的索引

    // 遍历剩余节点，收集到Fragment end注释为止的所有节点
    for (let i = index + 1; i < childNodes.length; i++) {
      const node = childNodes[i]
      arr.push(node as HostElements) // 将节点添加到数组中
      // 如果找到Fragment end注释，停止收集
      if (node.nodeType === Node.COMMENT_NODE && node.nodeValue === 'Fragment end') {
        endIndex = i // 记录Fragment end注释的索引
        break
      }
    }
    // 返回Fragment节点数组，nextIndex为Fragment end元素的index+1
    return { el: arr, kind: NodeKind.FRAGMENT, nextIndex: endIndex + 1, tag: FRAGMENT_NODE_TYPE }
  } else {
    // 非Fragment节点，nextIndex为当前index+1
    return { el: firstNode, nextIndex: index + 1, ...elToKind(firstNode) }
  }
}

/**
 * 计算 container 中 start 与 end 之间（**不包括 start/end**）的节点数量。
 *
 * @param container - 父容器（必须包含 start 和 end，或至少包含 start）
 * @param start - 起始节点（通常是注释锚点）
 * @param end - 结束节点（通常是注释锚点）
 * @returns number - start 和 end 之间的节点数量（不包含 start/end）。strict=true 且 end 不存在时抛错。
 */
export function countNodesBetween(
  container: Element | HostElements[],
  start: Node,
  end: Node
): number {
  if (isArray(container)) return container.length - 2
  // 验证 container 参数为祖先（快速检测）
  if (!container.contains(start)) {
    throw new Error('countNodesBetween: start node is not contained in container')
  }
  if (!container.contains(end)) {
    throw new Error('countNodesBetween: end node is not contained in container (strict mode)')
  }

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
export function appendChild(container: Element | HostElements[], el: HostNodeElements): void {
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

/**
 * 在指定元素前插入新元素
 * @param container - 目标容器元素，可以是单个元素或元素数组
 * @param el - 要插入的元素
 * @param anchor - 参考元素，新元素将插入到此元素之前
 */
export function insertBefore(
  container: Element | HostElements[], // 目标容器，支持单个元素或元素数组
  el: HostNodeElements, // 需要插入的元素
  anchor: Node // 作为插入位置的参考节点
): void {
  // 判断容器是否为数组，如果是则取第一个元素的父元素，否则直接使用容器
  const parent: Element = isArray(container) ? container.at(0)!.parentElement! : container
  // 执行插入操作，将el插入到anchor节点之前
  parent.insertBefore(el, anchor)
}

/**
 * 替换指定容器中的子节点
 * @param container - 目标容器，可以是单个Element或HostElements数组
 * @param el - 要插入的HostNodeElements节点
 * @param anchor - 作为参照的节点，新节点将替换此节点
 */
export function replaceChild(
  container: Element | HostElements[], // 容器元素，可以是单个元素或元素数组
  el: HostNodeElements, // 要插入的节点元素
  anchor: Node // 锚点节点，将被新节点替换
) {
  const parent: Element = isArray(container) ? container.at(0)!.parentElement! : container // 判断容器是否为数组，如果是则取第一个元素的父元素，否则直接使用容器
  parent.replaceChild(el, anchor) // 使用父元素的replaceChild方法替换节点
}

/** 移除 container 下指定 index 之后的所有多余节点 */
export function cleanupExtraDom(node: RegularElementNode): void {
  const lastVNode = node.children.at(-1)
  const container = node.el!
  if (!lastVNode) {
    container.innerHTML = ''
    return
  }
  // 获取最后一个子节点的真实 DOM
  let lastChildEl = lastVNode.el!
  if (lastChildEl.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    lastChildEl = (lastChildEl as HostFragmentElement).$endAnchor
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
export function cleanupFragmentRange(node: FragmentNode): void {
  const start = node.el!.$startAnchor
  const end = node.el!.$endAnchor

  // 如果没有子节点，则清空 start/end 之间的所有节点
  if (!node.children.length) {
    const range = document.createRange()
    range.setStartAfter(start)
    range.setEndBefore(end)
    range.deleteContents()
    return
  }

  // 获取最后一个子节点对应的真实 DOM
  let lastChildEl = node.children.at(-1)!.el!
  if (lastChildEl.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    lastChildEl = (lastChildEl as HostFragmentElement).$endAnchor
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
export function resolveContainer(container: HostElements | Element | string): Element {
  const el = typeof container === 'string' ? document.querySelector(container) : container // 如果是字符串则查询DOM，否则直接使用原参数
  if (el instanceof Element) {
    return el // 如果是有效的DOM元素则直接返回
  } else {
    throw new TypeError('[resolveContainer]: container must be a selector string or Element') // 否则抛出错误
  }
}
