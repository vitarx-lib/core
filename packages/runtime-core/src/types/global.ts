import type { Component } from './component.js'
import type { ErrorHandler } from './hook.js'
import type {
  IntrinsicAttributes as GlobalIntrinsicAttributes,
  JSXElementAttributes,
  MaybeRef,
  WithRefProps
} from './props.js'
import type { View } from './view.js'

declare global {
  namespace Vitarx {
    /**
     * 宿主平台父节点接口
     *
     * @example
     * ```ts
     * declare global {
     *   namespace Vitarx {
     *     // 重写 DOM 平台的支持做为父元素的元素类型
     *     interface HostParentNode extends ParentNode {
     *
     *     }
     *   }
     * }
     * ```
     */
    interface HostContainerNode {}
    /**
     * 允许渲染的元素
     *
     * 宿主平台包可以重写此接口以支持Tsx类型校验。
     */
    interface IntrinsicElements {
      svg: {}
    }
    /**
     * 渲染上下文
     */
    interface RenderContext {
      [K: string]: any
    }
    interface HostFragmentNode {}
    /**
     * 宿主平台文本节点接口
     *
     * 用于表示纯文本内容的节点，如 <div>Hello</div> 中的 "Hello"。
     * 文本节点只能包含纯文本内容，不能包含其他元素。
     */
    interface HostTextNode {}
    /**
     * 宿主平台注释节点接口
     *
     * 用于表示注释内容，如 <div><!--This is a comment--></div> 中的 "This is a comment"。
     * 在开发过程中，注释节点可用于显示调试信息，如条件渲染的提示。
     */
    interface HostCommentNode {}
    /**
     * 宿主平台运行时节点映射
     *
     * 此类型定义了运行时支持的元素类型标签与其实例的映射关系。
     *
     * @example
     * ```ts
     * declare global {
     *   namespace Vitarx {
     *     interface HostElementTagMap {
     *       div: HTMLDivElement,
     *       span: HTMLSpanElement,
     *       // 其他映射...
     *     }
     *   }
     * }
     * ```
     */
    interface HostElementTagMap {
      svg: {}
    }
    /**
     * 元素支持的样式规则
     *
     * 运行时支持的样式规则映射，base 包中未定义任何规则，需要在各平台渲染包中扩展此类型。
     */
    interface HostStyleRules {}
    /**
     * Vitarx 框架内置固有属性
     */
    interface IntrinsicAttributes extends GlobalIntrinsicAttributes {
      /**
       * 显示/隐藏节点
       *
       * 此属性会给元素添加上 `display: none` 样式，
       * 它可能会和元素原有的样式冲突，请自行处理。
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
       * 条件渲染指令 - v-if
       *
       * 用于条件性地渲染元素。
       * 当表达式的值为真时，元素将被渲染；否则，元素不会被渲染到DOM中。
       *
       * ```tsx
       * const show = ref(true)
       * // v-if指令不支持 ref 自动解包，必须使用.value
       * <div v-if={show.value}></div>
       * ```
       */
      'v-if'?: unknown
      /**
       * 条件渲染指令 - v-else
       *
       * 用于表示else块。
       * 必须紧跟在v-if或v-else-if元素后面。
       *
       * ```tsx
       * const show = ref(false)
       * <div v-if={show.value}></div>
       * <div v-else></div>
       * ```
       */
      'v-else'?: unknown
      /**
       * 条件渲染指令 - v-else-if
       *
       * 用于表示else-if块。
       * 必须紧跟在v-if或v-else-if元素后面。
       *
       * ```tsx
       * const show = ref(1)
       * <div v-if={show.value === 0}></div>
       * <div v-else-if={show.value === 1}></div>
       * <div v-else></div>
       * ```
       */
      'v-else-if'?: unknown
    }
    /**
     * App配置项
     */
    interface AppConfig {
      /**
       * 错误处理函数
       *
       * @param error - 捕获到的异常
       * @param info - 具体的错误信息
       * @default (error, info) => {
       *   logger.error('uncaught exceptions',error,info)
       * }
       */
      errorHandler?: ErrorHandler
      /**
       * useId() 返回的 ID 前缀
       *
       * 默认为 `v-`
       */
      idPrefix?: string
    }
  }
  /**
   * JSX 命名空间定义了 JSX 语法在 Vitarx 框架中的类型支持
   * 这些类型使 TypeScript 能够正确理解和使用 JSX 语法
   */
  namespace JSX {
    /**
     * 定义 JSX 元素的类型，可以是字符串（原生 HTML 标签）或组件
     * 例如：'div'、MyComponent 等
     */
    type ElementType = keyof IntrinsicElements | Component
    type Element = View
    /**
     * JSX 内置属性接口，扩展了 Vitarx 的内置属性
     * 包含所有 JSX 元素都可以使用的通用属性
     */
    interface IntrinsicAttributes extends Vitarx.IntrinsicAttributes {}
    /**
     * JSX 内置元素类型定义
     * 将原生 HTML 标签名映射到对应的属性类型，并添加 ref 支持
     * 例如：div、span、button 等标签的属性类型
     */
    type IntrinsicElements = {
      [tagName in keyof Vitarx.IntrinsicElements]: WithRefProps<Vitarx.IntrinsicElements[tagName]>
    }
    /**
     * 库管理的属性类型
     * 用于处理组件属性的类型转换和验证
     * C: 组件类型，P: 属性类型
     */
    type LibraryManagedAttributes<C, P> = JSXElementAttributes<C, P>
    interface ElementAttributesProperty {
      props: {}
    }
    interface ElementChildrenAttribute {
      children: {}
    }
  }
}
