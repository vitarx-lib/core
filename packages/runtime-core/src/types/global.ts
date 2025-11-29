import { type Dynamic, DYNAMIC_RENDER_TYPE } from '../constants/index.js'
import { Widget } from '../widget/index.js'
import type { IntrinsicSpecialElements } from './element.js'
import type { ErrorHandler } from './lifecycle.js'
import type { VNode } from './nodes/index.js'
import type {
  IntrinsicAttributes as GlobalIntrinsicAttributes,
  JSXElementAttributes,
  WithRefProps
} from './props.js'
import type { AnyProps, FunctionWidget, JSXElementConstructor, WidgetPropsType } from './widget.js'

declare global {
  namespace Vitarx {
    /**
     * 宿主平台父节点接口
     *
     * 为了能让 `v-parent` 的类型声明符合运行时元素实例的类型要求，宿主平台特定包需要重写此接口。
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
    interface HostParentNode {}
    /**
     * 允许渲染的元素接口
     *
     * 默认只包含了框架内置的特殊元素，其他元素需要在宿主平台包中声明合并。
     *
     * 宿主平台包可以重写此接口以支持更多元素类型。
     */
    interface IntrinsicElements extends IntrinsicSpecialElements {
      /**
       * 动态渲染
       *
       * 用于根据传入的 `is` 动态渲染组件或元素。
       *
       * @example
       * ```tsx
       * const current = ref('A')
       * const widgets = { A: WidgetA, B: WidgetB, C: WidgetC }
       * const currentWidget = computed(() => widgets[current.value])
       *
       * // 1️⃣ 基础用法
       * <render is={currentWidget} />
       *
       * // 2️⃣ 透传 props
       * <render is={currentWidget} v-bind={ name: 'John' } style={{background:'red'}}/>
       *
       * // 3️⃣ 通过 children 属性传递子元素
       * <render is={currentWidget} children={<div>Hello</div>} />
       *
       * // 4️⃣ 通过插槽传递子元素
       * <render is={currentWidget}>
       *   <div>Hello</div>
       * </render>
       *
       * // 5️⃣ 组件方式使用
       * <Render is={currentWidget}/>
       * ```
       */
      [DYNAMIC_RENDER_TYPE]: WidgetPropsType<Dynamic>
    }

    /**
     * 宿主平台片段节点接口
     *
     * 用于表示虚拟的片段节点，通常用于包装多个子节点而不产生额外的DOM元素。
     * 在渲染时，片段节点本身不会渲染为任何实体元素，只会渲染其子节点。
     */
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
     * 在 base 包中初始为空接口，各平台渲染包会通过 TypeScript 的声明合并
     * 机制扩展此类型，添加平台特定的元素类型映射。
     *
     * @example
     * ```ts
     * // 在 DOM 平台渲染包中扩展
     * declare global {
     *   namespace Vitarx {
     *     types HostNodeMap = {
     *       div: HTMLDivElement,
     *       span: HTMLSpanElement,
     *       // 其他映射...
     *     }
     *   }
     * }
     * ```
     */
    interface HostNodeMap {
      /**
       * 片段元素
       */
      fragment: HostFragmentNode
      /**
       * 纯文本
       *
       * 用于处理纯文本节点，如 <div>Hello</div> 中的 "Hello"。
       *
       * @remarks 开发者无需在视图中使用它，在内部逻辑中会自动转换。
       */
      'plain-text': HostTextNode
      /**
       * 注释
       *
       * 用于处理注释节点，如 <div><!--This is a comment--></div> 中的 "This is a comment"。
       *
       * 开发时内部会使用注释来提示一些重要信息，如 `v-if = false` 在开发阶段可以通过开发者控制台查看到 `<!--v-if-->` 便于调试。
       *
       * @remarks 不建议在视图中使用它，除非你真的需要在生产环境中显示一段注释。
       */
      comment: HostCommentNode
    }
    /**
     * 元素支持的样式规则
     *
     * 运行时支持的样式规则映射，base 包中未定义任何规则，需要在各平台渲染包中扩展此类型。
     */
    interface HostStyleRules {}
    /**
     * 运行时无子节点元素实例映射
     */
    interface HostVoidElementMap {}
    /**
     * Vitarx 框架内置固有属性
     */
    interface IntrinsicAttributes extends GlobalIntrinsicAttributes {}
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
    /**
     * 函数式组件类型别名
     */
    type FC<P extends AnyProps = any> = FunctionWidget<P>
    /**
     * 函数式组件类型别名
     */
    type FW<P extends AnyProps = any> = FunctionWidget<P>
  }
  /**
   * JSX 命名空间定义了 JSX 语法在 Vitarx 框架中的类型支持
   * 这些类型使 TypeScript 能够正确理解和使用 JSX 语法
   */
  namespace JSX {
    /**
     * 定义 JSX 元素的类型，可以是字符串（原生 HTML 标签）或组件构造函数
     * 例如：'div'、MyComponent 等
     */
    type ElementType = string | JSXElementConstructor<any>

    /**
     * JSX 元素的类型，对应 Vitarx 框架中的 VNode
     * 所有 JSX 元素在编译后都会转换为 VNode
     */
    type Element = VNode

    /**
     * JSX 元素类的类型，对应 Vitarx 框架中的 Widget
     * 用于定义类组件的实例类型
     */
    type ElementClass = Widget

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
