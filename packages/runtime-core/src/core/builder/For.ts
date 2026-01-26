import type { CodeLocation } from '../../types/index.js'
import { type ForProps, ForView } from '../view/for.js'
import { builder, type ViewBuilder } from './factory.js'

/**
 * For 循环渲染组件
 *
 * @example
 * ```tsx
 * <For each={items}>
 *   { item => <div>{item}</div> }
 * </For>
 * ```
 *
 * @template T 数组元素类型
 * @param props 包含 each 和 children 属性的对象
 * @param location 代码位置信息，用于调试
 * @returns ForView 实例
 */
export const For = builder((props: ForProps, location?: CodeLocation): ForView => {
  return new ForView(props, location)
})
export type For = ViewBuilder<ForProps, ForView> & { __is_for: true }
