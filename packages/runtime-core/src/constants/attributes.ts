/**
 * 内置全局特殊属性
 *
 * 定义了框架内置的特殊属性列表，这些属性具有特殊的含义和行为。
 * 它们不会被直接传递给DOM元素，而是由框架内部处理，用于实现各种功能。
 *
 * 属性说明：
 * - children: 子元素
 * - key: 节点的唯一标识，用于diff算法
 * - ref: 节点引用，用于直接访问DOM元素或组件实例
 * - v-if: 条件渲染
 * - v-bind: 属性绑定
 * - v-show: 条件显示
 * - v-memo: 记忆化优化
 * - v-static: 静态标记
 * - v-parent: 父节点绑定
 */
export const INTRINSIC_ATTRIBUTES = new Set<string>([
  'children',
  'key',
  'ref',
  'v-if',
  'v-bind',
  'v-show',
  'v-memo',
  'v-static',
  'v-parent'
])
