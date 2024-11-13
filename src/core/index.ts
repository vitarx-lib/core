import type { IntrinsicAttributes, RefEl, TextVNode, VNode, Widget } from './view/index.js'
import type { HtmlIntrinsicElements } from './view/web-render/index.js'

export * from './variable/index.js'
export * from './observer/index.js'
export * from './scope/index.js'
export * from './view/index.js'
export * from './vitarx-app.js'

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
    type VNode = import('./view/VNode').VNode
    /** 元素类型 */
    type Element = VNode | (() => Element)
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
