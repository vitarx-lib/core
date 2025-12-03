/**
 * 片段节点标签常量
 *
 * 定义了片段节点的标识符，用于在虚拟DOM中表示不需要额外DOM元素的节点组。
 * 片段节点允许组件返回多个子节点而不需要包裹元素。
 */
export const FRAGMENT_NODE_TYPE = 'fragment'

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
