import type { AnyChild, ValidNodeType, VNode } from '../types/index.js'

/**
 * 片段节点标签常量
 *
 * 定义了片段节点的标识符，用于在虚拟DOM中表示不需要额外DOM元素的节点组。
 * 片段节点允许组件返回多个子节点而不需要包裹元素。
 */
export const FRAGMENT_NODE_TYPE = 'fragment'

/**
 * 片段元素组件
 *
 * Fragment 是一个特殊的组件，用于将多个子元素组合在一起，而不在DOM中创建额外的节点。
 * 它的实现通过类型重载将字符串常量转换为函数组件形式，便于在JSX中使用。
 *
 * 在虚拟节点创建过程中，Fragment 会被识别为 FRAGMENT_NODE_TYPE 类型，
 * 并进行特殊处理以避免创建不必要的DOM元素。
 *
 * 支持三种等价的使用方式：
 * - `<Fragment>...</Fragment>`：显式使用Fragment组件
 * - `<fragment>...</fragment>`：使用小写标签形式
 * - `<>...</>`：使用空标签简写形式
 *
 * @example
 * ```tsx
 * // 使用Fragment
 * return (
 *   <Fragment>
 *     <Child1 />
 *     <Child2 />
 *   </Fragment>
 * );
 *
 * // 使用空标签简写
 * return (
 *   <>
 *     <Child1 />
 *     <Child2 />
 *   </>
 * );
 * ```
 */
export const Fragment = FRAGMENT_NODE_TYPE as unknown as {
  (props: { children?: AnyChild }): VNode
  __isFragment__: true
}
export type Fragment = typeof Fragment

/**
 * 纯文本节点标签常量
 *
 * 定义了纯文本节点的标识符，用于在虚拟DOM中表示纯文本内容。
 * 纯文本节点是最基础的节点类型，用于渲染字符串形式的文本数据。
 */
export const TEXT_NODE_TYPE = 'plain-text'
/**
 * 注释节点标签常量
 *
 * 定义了注释节点的标识符，用于在虚拟DOM中表示HTML注释。
 * 注释节点不会在页面上显示，但在调试和开发过程中可能有用。
 */
export const COMMENT_NODE_TYPE = 'comment'

/**
 * 动态渲染标签常量
 *
 * 定义了动态渲染节点的标识符，用于在虚拟DOM中表示需要动态计算和渲染的内容。
 * 动态渲染节点通常用于实现条件渲染、循环渲染等高级功能。
 */
export const DYNAMIC_RENDER_TYPE = 'dynamic'
export type DynamicRenderType = typeof DYNAMIC_RENDER_TYPE
/**
 * 动态渲染组件
 *
 * Dynamic 是一个特殊的组件，用于标记需要动态计算和渲染的内容。
 * 它的实现通过类型重载将 `dynamic` 转换为函数组件形式。
 *
 * 动态渲染在节点构建时会被特殊处理，允许在运行时动态计算其内容。
 * 这对于实现条件渲染、异步内容加载等高级功能非常有用。
 *
 * @example
 * ```tsx
 * // 使用Render组件动态加载内容
 * return (
 *   <Render is={currentWidget}/>
 * );
 * ```
 */
export const Dynamic = DYNAMIC_RENDER_TYPE as unknown as {
  (props: {
    is: Exclude<ValidNodeType, Dynamic | DynamicRenderType>
    children?: AnyChild
    [key: string]: any
  }): VNode
  __isDynamicRender__: true
}
export type Dynamic = typeof Dynamic
