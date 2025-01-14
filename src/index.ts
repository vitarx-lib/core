import type {
  ClassWidgetConstructor,
  FnWidgetConstructor,
  IntrinsicAttributes,
  RefEl,
  TextVNode,
  VNode as _VNODE,
  VNodeType,
  Widget
} from './core/index.js'
import type {
  CssPropertiesMap,
  HTMLClassProperties,
  HtmlIntrinsicElements,
  HTMLIntrinsicTags,
  HTMLStyleProperties
} from './core/renderer/web-runtime-dom/type.js'

export * from './core/index.js'
export * from './utils/index.js'
export * from './jsx-runtime.js'

declare global {
  namespace Vitarx {
    /** 应用配置 */
    interface AppOptions {
      /**
       * 是否为服务端渲染
       *
       * 此配置功能暂未支持，可能会在之后的版本中支持。
       *
       * @default false
       */
      ssr?: boolean
    }

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
    type HT = HTMLIntrinsicTags
    /**
     * HTML元素标签类型
     */
    type HtmlTags = HTMLIntrinsicTags
    /**
     * 函数式小部件函数类型
     */
    type FW = FnWidgetConstructor
    /**
     * 类定义小部件构造函数类型
     */
    type CW = ClassWidgetConstructor

    /** 兼容JSX，同VNode类型一致 */
    interface Element<T extends VNodeType = VNodeType> extends _VNODE<T> {}
    /** 类组件实例 */
    type ElementClass = Widget
    /**
     * 任意子节点
     */
    type AnyChildren = Element | Element[] | Exclude<AnyPrimitive, symbol>
  }
  namespace JSX {
    /** 元素类型 */
    type Element = Vitarx.Element
    /** 类组件实例 */
    type ElementClass = Vitarx.ElementClass

    /** 固有元素 */
    interface IntrinsicElements extends HtmlIntrinsicElements {}

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

    type Children = Element | _VNODE | TextVNode | AnyPrimitive | Array<Children>
  }
}
