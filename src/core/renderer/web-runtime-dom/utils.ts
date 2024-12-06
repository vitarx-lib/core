import { type HtmlElement, isVDocumentFragment, type VDocumentFragment } from './type.js'

/**
 * 恢复 Fragment 元素
 *
 * @param el - DocumentFragment实例
 */
export function recoveryFragment<T>(el: T): T {
  if (isVDocumentFragment(el)) {
    for (let i = 0; i < el.__backup.length; i++) {
      el.appendChild(el.__backup[i])
    }
  }
  return el
}

/**
 * 备份 Fragment 元素
 *
 * @param el
 */
export function backupFragment(el: DocumentFragment) {
  const nodes: Node[] = []
  for (let i = 0; i < el.childNodes.length; i++) {
    nodes.push(el.childNodes[i])
  }
  ;(el as VDocumentFragment)['__backup'] = nodes as Array<Element | Text>
}

/**
 * 获取片段的第一个元素
 *
 * @param el
 */
export function getVDocumentFragmentFirstEl(
  el: VDocumentFragment
): Exclude<HtmlElement, VDocumentFragment> {
  let first = el.__backup[0]
  while (isVDocumentFragment(first)) {
    first = first.__backup[0]
  }
  return first
}

/**
 * 获取片段的最后一个元素
 *
 * @param el
 */
export function getVDocumentFragmentLastEl(
  el: VDocumentFragment
): Exclude<HtmlElement, VDocumentFragment> {
  let first = el.__backup[el.__backup.length - 1]
  while (isVDocumentFragment(first)) {
    first = first.__backup[first.__backup.length - 1]
  }
  return first
}

/**
 * 获取父元素
 *
 * 等同于 `document.getElementById(id).parentNode`，只是对片段元素进行特殊处理。
 *
 * @param el
 */
export function getElParentNode(el: HtmlElement | null): ParentNode | null {
  if (!el) return null
  if (isVDocumentFragment(el)) {
    let first = el.__backup[0]
    while (isVDocumentFragment(first)) {
      first = first.__backup[0]
    }
    return first.parentNode
  }
  return el.parentNode
}
