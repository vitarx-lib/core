/**
 * 内置全局特殊属性
 *
 * 定义了框架内置的特殊属性列表，这些属性具有特殊的含义和行为。
 * 它们不会被直接传递给DOM元素，而是由框架内部处理，用于实现各种功能。
 *
 * 属性说明：
 * - children: 子节点列表
 * - ref: 节点引用，用于直接访问DOM元素或组件实例
 */
export const INTRINSIC_ATTRIBUTES = new Set<string>(['children', 'ref'])
