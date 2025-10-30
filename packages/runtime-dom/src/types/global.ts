import type { HTMLStyleRules } from './attributes.js'
import type { HTMLElementTagMap, HTMLIntrinsicElement, HTMLVoidElementMap } from './element.js'

declare global {
  namespace Vitarx {
    interface IntrinsicElements extends HTMLIntrinsicElement {}
    interface HostParentElement extends ParentNode {}
    interface HostElementInstanceMap extends HTMLElementTagMap {
      /**
       * 片段元素
       */
      fragment: DocumentFragment
      /**
       * 纯文本
       *
       * 用于处理纯文本节点，如 <div>Hello</div> 中的 "Hello"。
       *
       * @remarks 开发者无需在视图中使用它，在内部逻辑中会自动转换。
       */
      'plain-text': Text
      /**
       * 注释
       *
       * 用于处理注释节点，如 <div><!--This is a comment--></div> 中的 "This is a comment"。
       *
       * 开发时内部会使用注释来提示一些重要信息，如 `v-if = false` 在开发阶段可以通过开发者控制台查看到 `<!--v-if-->` 便于调试。
       *
       * @remarks 不建议在视图中使用它，除非你真的需要在生产环境中显示一段注释。
       */
      comment: Comment
    }
    interface HostVoidElementNamesMap extends HTMLVoidElementMap {}
    interface HostStyleRules extends HTMLStyleRules {}
  }
}
