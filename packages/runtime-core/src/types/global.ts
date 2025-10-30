import { DYNAMIC_RENDER_TYPE, type Render } from '../vnode/constants/index.js'
import type { IntrinsicSpecialElements } from './element.js'
import type {
  IntrinsicAttributes as GlobalIntrinsicAttributes,
  WithDefaultProps,
  WithRefProps
} from './props.js'
import type { ValidBuildElement, WidgetPropsType, WidgetType } from './widget.js'

declare global {
  namespace Vitarx {
    /**
     * 宿主平台父元素接口
     *
     * 为了能让 `v-parent` 的类型声明符合运行时元素实例的类型要求，宿主平台特定包需要重写此接口。
     *
     * @example
     * ```ts
     * declare global {
     *   namespace Vitarx {
     *     // 重写 Web 平台的支持做为父元素的元素类型
     *     interface RuntimeParentElement extends ParentNode {
     *
     *     }
     *   }
     * }
     * ```
     */
    interface HostParentElement {}
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
     * 运行时DOM实例映射
     *
     * 此类型定义了运行时支持的tag与其实例的映射关系。
     * 在 core 包中初始为空对象，各平台渲染包会通过 TypeScript 的声明合并
     * 机制扩展此类型，添加平台特定的元素类型映射。
     *
     * @example
     * ```ts
     * // 在 Web 平台渲染包中扩展
     * declare global {
     *   namespace Vitarx {
     *     types RuntimeDomInstanceMap = {
     *       div: HTMLDivElement,
     *       span: HTMLSpanElement,
     *       // 其他元素映射...
     *     }
     *   }
     * }
     * ```
     */
    interface HostElementInstanceMap {}
    /**
     * 元素支持的样式规则
     *
     * 运行时支持的样式规则映射，core 包中未定义任何规则，需要在各平台渲染包中扩展此类型。
     */
    interface HostStyleRules {}
    /**
     * 运行时无子节点元素实例映射
     */
    interface HostVoidElementNamesMap {}
    /**
     * Vitarx 框架内置固有属性
     */
    interface IntrinsicAttributes extends GlobalIntrinsicAttributes {}
  }
  namespace JSX {
    /**
     * JSX 元素类型
     *
     * 定义了 JSX 表达式返回值的类型，对应于有效的子节点类型。
     * 这使得 JSX 表达式可以直接用作组件的子元素。
     */
    type Element = ValidBuildElement
    interface IntrinsicAttributes extends Vitarx.IntrinsicAttributes {}
    /**
     * JSX 支持的固有元素
     *
     * 定义了 JSX 中可以直接使用的标签及其属性类型。
     * 这些元素是框架内置的，不需要额外导入即可使用。
     * 通过扩展 RuntimeSpecialElements，框架提供了特殊元素（如 fragment、text 等）的支持。
     *
     * @example
     * ```ts
     * // 在 Web 平台渲染包中扩展
     * declare global {
     *   namespace JSX {
     *     interface IntrinsicElements {
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
      C extends WidgetType<infer WP>
        ? WithRefProps<WithDefaultProps<WP, C['defaultProps']>>
        : P extends object
          ? WithRefProps<P>
          : {}
  }
}
