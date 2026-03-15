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
       * 此属性会给元素添加上 `display: none` 样式，用于组件会在组件根元素上应用样式！
       *
       * 注意：它可能会和元素原有的样式冲突，需自行确保兼容性。
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
      /**
       * 绑定 HTML 内容
       *
       * 仅支持用于 `<div>`、`<p>`、`<span>` 等块级HTML元素
       *
       * @example
       * ```tsx
       * const html = ref('<p>hello</p>')
       * // v-html 语法的使用 可以忽略.value
       * <div v-html={html} />
       * // 渲染结果
       * <div><p>hello</p></div>
       * ```
       */
      'v-html'?: MaybeRef<string>
      /**
       * 绑定文本内容
       *
       * 仅支持用于 `<div>`、`<p>`、`<span>` 等块级HTML元素
       *
       * @example
       * ```tsx
       * const text = ref('hello')
       * // v-text 语法的使用 可以忽略.value
       * <div v-text={text} />
       * // 渲染结果
       * <div>hello</div>
       * ```
       */
      'v-text'?: MaybeRef<string>
    }
  }
}
