import { DYNAMIC_RENDER_TYPE, type Render } from '../constants/index.js'
import type { IntrinsicSpecialElements } from './element.js'
import type { ErrorHandler } from './lifecycle.js'
import type {
  IntrinsicAttributes as GlobalIntrinsicAttributes,
  WithDefaultProps,
  WithRefProps
} from './props.js'
import type {
  AnyProps,
  FunctionWidget,
  ValidBuildResult,
  WidgetPropsType,
  WidgetTypes
} from './widget.js'

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
     *     nodes HostParentNode extends ParentNode {
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
      [DYNAMIC_RENDER_TYPE]: WidgetPropsType<Render>
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
  }
  namespace JSX {
    /**
     * JSX 元素类型
     *
     * 定义了 JSX 表达式返回值的类型，对应于有效的子节点类型。
     * 这使得 JSX 表达式可以直接用作组件的子元素。
     */
    type Element = ValidBuildResult
    /**
     * JSX 支持的固有属性
     */
    type IntrinsicAttributes = Vitarx.IntrinsicAttributes
    /**
     * JSX 支持的固有元素
     *
     * 定义了 JSX 中可以直接使用的标签及其属性类型。
     * 这些元素是框架内置的，不需要额外导入即可使用。
     *
     * @example
     * ```ts
     * // 在平台渲染包中扩展
     * declare global {
     *   namespace Vitarx {
     *     nodes IntrinsicElements {
     *       div: Partial<HTMLDivElement>, // 伪代码，具体实现需根据实际需求进行修改
     *       span: Partial<HTMLSpanElement>,
     *       // 其他元素映射...
     *     }
     *   }
     * }
     * ```
     */
    type IntrinsicElements = {
      [tagName in keyof Vitarx.IntrinsicElements]: WithRefProps<Vitarx.IntrinsicElements[tagName]>
    }
    /**
     * 组件属性类型转换
     *
     * 通过重载组件 Props 类型，为所有组件属性添加 `ref` 支持，
     * 并处理默认值的合并。这使得所有组件都可以支持 忽略 `.value` 使用 ref
     *
     * 根据组件类型（类组件或函数组件）进行不同的类型处理：
     * - 类组件：提取 Props 类型并合并默认值
     * - 函数组件：提取 Props 类型并合并默认值
     * - 其他对象类型：直接添加 ref 支持
     *
     * @template C 组件类型
     * @param P 原始属性类型
     */
    type LibraryManagedAttributes<C, P> =
      C extends WidgetTypes<infer WP>
        ? WithRefProps<WithDefaultProps<WP, C['defaultProps']>>
        : P extends object
          ? WithRefProps<P>
          : {}
  }
}
