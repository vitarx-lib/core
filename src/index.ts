import type {
  AppConfig as _AppOptions,
  CommentVNode,
  FnWidgetType,
  IntrinsicAttributes,
  RefEl,
  TextVNode,
  TSWidget as _TSWidget,
  ValueProxy,
  VNode as _VNODE,
  VNodeType,
  Widget,
  WidgetType
} from './core/index.js'
import type {
  CssPropertiesMap,
  HTMLClassProperties,
  HTMLIntrinsicElements,
  HTMLIntrinsicTags,
  HTMLStyleProperties
} from './core/renderer/index.js'

export * from './core/index.js'
export * from './utils/index.js'
export * from './jsx-runtime.js'

declare global {
  namespace Vitarx {
    /** 应用配置 */
    type AppConfig = _AppOptions

    /**
     * 全局属性
     */
    type GlobalIntrinsicAttributes = IntrinsicAttributes

    /**
     * 虚拟节点
     */
    type VNode<T extends VNodeType = VNodeType> = _VNODE<T>

    /**
     * CSS样式类型映射
     */
    type CssStyle = CssPropertiesMap
    /**
     * HTML style 属性类型
     */
    type HtmlStyleProperties = HTMLStyleProperties
    /**
     * HTML class 属性类型
     */
    type HtmlClassProperties = HTMLClassProperties
    /**
     * HTML元素标签类型
     */
    type HTML = HTMLIntrinsicTags
    /**
     * HTML元素标签类型
     */
    type HtmlTags = HTMLIntrinsicTags
    /**
     * 函数式小部件函数类型
     */
    type FW = FnWidgetType
    /**
     * TSX 类型支持工具
     *
     * 将异步组件，懒加载组件，等受 `Vitarx` 支持，但不被TSX支持的组件类型，
     * 重载为受支持的TSX组件类型，提供友好的参数类型校验。
     *
     * @example
     * ```tsx
     * async function AsyncWidget() {
     *   await new Promise((resolve) => setTimeout(resolve, 1000))
     *   return <div>Hello World</div>
     * }
     * // ❌ TSX 语法校验不通过！
     * <AsyncWidget />
     *
     * async function AsyncWidget(){
     *   // ...
     * } as TsWidget<typeof AsyncWidget>
     * // ✅ TSX 语法校验通过！
     * <AsyncWidget />
     * ```
     */
    type TSWidget<T extends WidgetType> = _TSWidget<T>
    /** 兼容JSX，同VNode类型一致 */
    interface Element<T extends VNodeType = VNodeType> extends _VNODE<T> {}
    /** 类组件实例 */
    type ElementClass = Widget
    /**
     * 子节点类型
     */
    type Children =
      | Element
      | TextVNode
      | CommentVNode
      | Exclude<AnyPrimitive, symbol>
      | ValueProxy<Element | TextVNode | CommentVNode | Exclude<AnyPrimitive, symbol>>
      | Array<Children>
  }
  namespace JSX {
    /** 元素类型 */
    type Element = Vitarx.Element
    /** 类组件实例 */
    type ElementClass = Vitarx.ElementClass

    /** 固有元素 */
    interface IntrinsicElements extends HTMLIntrinsicElements {}

    /** 固有属性 */
    interface IntrinsicAttributes extends Vitarx.GlobalIntrinsicAttributes {}

    /** 子节点类型校验 */
    export interface ElementChildrenAttribute {
      children: {}
    }

    /** 类组件属性 */
    export interface IntrinsicClassAttributes<T> {
      ref?: RefEl<T>
    }

    type Children = Vitarx.Children
  }
}
