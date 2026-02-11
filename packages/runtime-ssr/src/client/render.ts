import {
  FragmentView,
  getRenderer,
  type HostElement,
  type HostNode,
  type HostView,
  ListView,
  ViewKind
} from '@vitarx/runtime-core'
import { isArray } from '@vitarx/utils'
import type { DOMElement, DOMNodeList } from '../shared/types.js'

/**
 * 渲染常规视图
 *
 * 仅渲染元素自身，未设置属性，未渲染子节点！
 *
 * @param view - 视图
 * @param container - 容器，用于判断是否使用SVG命名空间
 */
export function renderViewNode(
  view: ListView | HostView,
  container: DOMElement | DOMNodeList
): HostNode {
  const renderer = getRenderer()
  const kind = view.kind
  switch (kind) {
    case ViewKind.ELEMENT:
      const parent = isArray(container) ? container[0].parentNode! : container
      view['hostNode'] = renderer.createElement(
        view.tag,
        renderer.isSVGElement(parent as HostElement)
      )
      break
    case ViewKind.TEXT:
      view['hostNode'] = renderer.createText(view.text)
      break
    case ViewKind.COMMENT:
      view['hostNode'] = renderer.createComment(view.text)
      break
    case ViewKind.LIST:
    case ViewKind.FRAGMENT:
      const fragment = renderer.createFragment(view)
      ;(view as FragmentView)['hostNode'] = fragment
      break
    default:
      throw new Error('Unknown node kind')
  }
  return view.node
}
