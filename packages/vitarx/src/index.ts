import type {
  ClassProperties,
  FunctionWidget,
  IntrinsicNodeElement,
  IntrinsicProperties,
  StyleProperties,
  StyleRules,
  TSWidget as _TSWidget,
  VNode,
  VNodeType,
  Widget
} from '@vitarx/runtime-core'

export * from '@vitarx/utils'
export * from '@vitarx/responsive'
export * from '@vitarx/runtime-core'
export * from './app'

declare global {
  namespace Vitarx {
    /**
     * CSS样式类型映射
     */
    type CssStyle = StyleRules
    /**
     * HTML style 属性类型
     */
    type HtmlStyleProperties = StyleProperties
    /**
     * HTML class 属性类型
     */
    type HtmlClassProperties = ClassProperties
    /**
     * 函数式小部件函数类型
     */
    type FnWidget = FunctionWidget
    /**
     * TSX 类型支持工具
     *
     * 将不被TSX支持的组件类型（如：异步组件，懒加载组件），重载为受支持的TSX组件类型，提供友好的参数类型校验。
     *
     * @example
     * ```tsx
     * async function AsyncWidget() {
     *   await new Promise((resolve) => setTimeout(resolve, 1000))
     *   return <div>Hello World</div>
     * }
     * export default AsyncWidget
     * <AsyncWidget /> // ❌ TSX 语法校验不通过！
     *
     * export default AsyncWidget as unknown as Vitarx.TSWidget<typeof AsyncWidget>
     * <AsyncWidget /> // ✅ TSX 语法校验通过！
     * ```
     */
    type TSWidget<T extends FunctionWidget> = _TSWidget<T>
    /** 兼容JSX，同VNode类型一致 */
    type Element<T extends VNodeType = VNodeType> = VNode<T>
    /** 类组件实例 */
    type ElementClass = Widget
  }
  namespace JSX {
    /** 元素类型 */
    type Element = Vitarx.Element
    /** 类组件实例 */
    type ElementClass = Vitarx.ElementClass

    /** 固有元素 */
    interface IntrinsicElements extends IntrinsicNodeElement {}

    /** 固有属性 */
    interface IntrinsicAttributes extends IntrinsicProperties {}

    /** 子节点类型校验 */
    export interface ElementChildrenAttribute {}
  }
}
