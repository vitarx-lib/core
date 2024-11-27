import type { IntrinsicAttributes, RefEl, TextVNode, VNode, Widget } from './core/index.js'
import type { HtmlIntrinsicElements } from './core/view/web-render/index.js'

export * from './core/index.js'
export * from './utils/index.js'

declare global {
  namespace Vitarx {
    /** 应用配置 */
    interface AppOptions {
      /** 是否启用服务端渲染 */
      ssr?: boolean
    }

    /**
     * 全局属性
     *
     * - `ref`: 用于绑定元素实例。
     * - `key`: 用于绑定元素节点的key，支持`key.value`获取key值。
     */
    type GlobalIntrinsicAttributes = IntrinsicAttributes
    /**
     * 虚拟节点
     */
    type VNode = import('./core/view/VNode').VNode
    /** 元素类型 */
    type Element = import('./core/view/VNode').VNode
    /** 类组件实例 */
    type ElementClass = Widget
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

    type Children = Element | VNode | TextVNode | AnyPrimitive | Array<Children>
  }
}
