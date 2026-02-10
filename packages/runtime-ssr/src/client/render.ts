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

export function normalRender(
  view: ListView | HostView,
  container: DOMElement | DOMNodeList
): HostNode {
  const renderer = getRenderer()
  switch (view.kind) {
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
    default:
      const fragment = renderer.createFragment(view)
      ;(view as FragmentView)['hostNode'] = fragment
      break
  }
  return view.node
}
