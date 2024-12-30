import type {
  IntrinsicAttributes,
  RefEl,
  TextVNode,
  VNode as _VNODE,
  VNodeType,
  Widget
} from './core/index.js'
import { HtmlIntrinsicElements } from './core/renderer/web-runtime-dom/type.js'

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
     *
     * - `ref`: 用于绑定元素实例。
     * - `key`: 用于绑定元素节点的key，支持`key.value`获取key值。
     */
    type GlobalIntrinsicAttributes = IntrinsicAttributes
    /**
     * 虚拟节点
     */
    type VNode<T extends VNodeType = VNodeType> = _VNODE<T>

    /** 兼容JSX元素类型 */
    interface Element<T extends VNodeType = VNodeType> extends _VNODE<T> {}
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

    type Children = Element | _VNODE | TextVNode | AnyPrimitive | Array<Children>
  }
}

export * from './core/index.js'
export * from './utils/index.js'
export * from './jsx-runtime.js'
