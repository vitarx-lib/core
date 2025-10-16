import type { RefSignal } from '@vitarx/responsive'
import { VNode } from './nodes/index.js'
import type { AnyChildren, Child, VNodeType } from './types/index.js'

/**
 * VNode对象标识符
 */
export const VNODE_SYMBOL = Symbol('VNODE_SYMBOL')

/**
 * 片段节点类型常量
 */
export const FRAGMENT_NODE_TYPE = 'fragment-node'
export type FRAGMENT_NODE_TYPE = typeof FRAGMENT_NODE_TYPE
/**
 * 片段元素组件
 *
 * 等价用法 `<Fragment>` 或 `<fragment-node>` 或 `<>`
 */
export const Fragment = FRAGMENT_NODE_TYPE as unknown as {
  (props: { children?: Child | Child[] }): VNode
  __isFragment__: true
}
export type Fragment = typeof Fragment

/**
 * 文本节点类型常量
 */
export const TEXT_NODE_TYPE = 'text-node'
export type TEXT_NODE_TYPE = typeof TEXT_NODE_TYPE
/**
 * 文本元素组件
 *
 * 通常你无需使用此标识符创建VNode，而是直接使用字符串作为子节点
 */
export const Text = TEXT_NODE_TYPE as unknown as {
  (props: { children: string | RefSignal<string> }): VNode
  __isText__: true
}
export type Text = typeof Text

/**
 * 注释节点类型常量
 */
export const COMMENT_NODE_TYPE = 'comment-node'
export type COMMENT_NODE_TYPE = typeof COMMENT_NODE_TYPE
/**
 * 注释元素组件
 *
 * 等价用法 `<Comment>`或`<comment-node>`
 */
export const Comment = COMMENT_NODE_TYPE as unknown as {
  (props: { children: string | RefSignal<string> }): VNode
  __isComment__: true
}
export type Comment = typeof Comment

/**
 * 动态组件类型常量
 */
export const DYNAMIC_WIDGET_TYPE = 'widget'
export type DYNAMIC_WIDGET_TYPE = typeof DYNAMIC_WIDGET_TYPE
/**
 * 动态渲染组件或元素的属性接口
 */
export interface DynamicWidgetProps {
  /**
   * 指定要渲染的实际组件或元素标签，可以是响应式引用
   */
  is: VNodeType | RefSignal<VNodeType>
  /**
   * 子节点，可以通过属性或插槽方式传入
   */
  children?: AnyChildren
}
/**
 * 动态虚拟节点组件
 *
 * 用于根据传入的 `is` 动态渲染组件或元素。
 *
 * @example
 * ```tsx
 * const current = ref('A')
 * const widgets = { A: WidgetA, B: WidgetB, C: WidgetC }
 * const currentWidget = computed(() => widgets[current.value])
 *
 * // 1️⃣ 基础用法
 * <DynamicWidget :is="currentWidget" />
 *
 * // 2️⃣ 透传 props
 * <DynamicWidget :is="currentWidget" :props="{ name: 'John' }" />
 *
 * // 3️⃣ 通过 children 属性传递
 * <DynamicWidget :is="currentWidget" :children={<div>Hello</div>} />
 *
 * // 4️⃣ 通过插槽传递
 * <DynamicWidget :is="currentWidget">
 *   <div>Hello</div>
 * </DynamicWidget>
 *
 * // 5️⃣ 做为 <widget> 特殊元素使用
 * <widget :is="currentWidget" />
 * ```
 */
export const DynamicWidget = DYNAMIC_WIDGET_TYPE as unknown as {
  (props: DynamicWidgetProps): VNode
  __isDynamicWidget__: true
}
export type DynamicWidget = typeof DynamicWidget
