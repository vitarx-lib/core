import { FragmentView, ListView } from '@vitarx/runtime-core'
import type { CSSProperties } from './attributes.js'
import type { HTMLElementTagMap, HTMLIntrinsicElement } from './element.js'

declare global {
  namespace Vitarx {
    interface IntrinsicElements extends HTMLIntrinsicElement {}
    interface HostContainerNode extends ParentNode {}
    interface HostFragmentNode extends DocumentFragment {
      $startAnchor: HostCommentNode
      $endAnchor: HostCommentNode
      $view: FragmentView | ListView
    }
    interface HostTextNode extends Text {}
    interface HostCommentNode extends Comment {}
    interface HostElementTagMap extends HTMLElementTagMap {}
    interface HostCSSProperties extends CSSProperties {}
  }
}
