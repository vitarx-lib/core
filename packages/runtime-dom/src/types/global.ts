import { FragmentView, ListView, type MaybeRef } from '@vitarx/runtime-core'
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
    interface IntrinsicAttributes {
      /**
       * 显示/隐藏元素
       *
       * 此属性会给元素添加上 `display: none` 样式，
       * 它可能会和元素原有的样式冲突，需自行确保兼容性。
       *
       * @example
       * ```tsx
       * const show = ref(false)
       * // v-show 语法的使用 可以忽略.value
       * <div v-show={show}></div>
       * // 渲染结果
       * <div style="display: none;"></div>
       * ```
       */
      'v-show'?: MaybeRef<boolean>
    }
  }
}
