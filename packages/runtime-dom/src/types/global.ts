import type { FragmentVNode } from '@vitarx/runtime-core'
import type { HTMLStyleRules } from './attributes.js'
import type { HTMLElementTagMap, HTMLIntrinsicElement, HTMLVoidElementMap } from './element.js'

declare global {
  namespace Vitarx {
    interface IntrinsicElements extends HTMLIntrinsicElement {}
    interface HostParentNode extends HTMLElement {}
    interface HostFragmentNode extends DocumentFragment {
      $startAnchor: HostCommentNode
      $endAnchor: HostCommentNode
      $vnode: FragmentVNode
    }
    interface HostTextNode extends Text {}
    interface HostCommentNode extends Comment {}
    interface HostNodeMap extends HTMLElementTagMap {}
    interface HostVoidElementMap extends HTMLVoidElementMap {}
    interface HostStyleRules extends HTMLStyleRules {}
  }
}
