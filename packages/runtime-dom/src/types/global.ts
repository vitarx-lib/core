import { ForView, FragmentView } from '@vitarx/runtime-core'
import type { HTMLStyleRules } from './attributes.js'
import type { HTMLElementTagMap, HTMLIntrinsicElement } from './element.js'

declare global {
  namespace Vitarx {
    interface IntrinsicElements extends HTMLIntrinsicElement {}
    interface HostFragmentNode extends DocumentFragment {
      $startAnchor: HostCommentNode
      $endAnchor: HostCommentNode
      $view: FragmentView | ForView
    }
    interface HostTextNode extends Text {}
    interface HostCommentNode extends Comment {}
    interface HostElementTagMap extends HTMLElementTagMap {}
    interface HostStyleRules extends HTMLStyleRules {}
  }
}
