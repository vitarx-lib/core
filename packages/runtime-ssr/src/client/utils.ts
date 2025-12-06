import {
  COMMENT_NODE_TYPE,
  FRAGMENT_NODE_TYPE,
  type HostElements,
  type HostNodeType,
  isVoidTag,
  NodeKind,
  type RegularElementNodeType,
  TEXT_NODE_TYPE
} from '@vitarx/runtime-core'

interface FirstNode {
  el: HostElements | HostElements[]
  nextIndex: number
  kind: NodeKind
  tag: HostNodeType
}

function elToKind(el: Element | Text | Comment): { kind: NodeKind; tag: HostNodeType } {
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
export function getFirstDomNode(el: Element, index: number = 0): FirstNode | null {
  const firstNode = el.childNodes[index] as HostElements // 获取指定索引的子节点
  if (!firstNode) return null
  // 检查第一个节点是否是Fragment start注释
  if (firstNode.nodeType === Node.COMMENT_NODE && firstNode.nodeValue === 'Fragment start') {
    const arr = [firstNode] as unknown as HostElements[] // 初始化数组，包含起始注释节点
    let endIndex = index // 记录Fragment end注释的索引

    // 遍历剩余节点，收集到Fragment end注释为止的所有节点
    for (let i = index + 1; i < el.childNodes.length; i++) {
      const node = el.childNodes[i]
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
