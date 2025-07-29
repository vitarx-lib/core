import type { RefEl } from '../core/index'

/**
 * 唯一键
 */
export type UniqueKey = string | number | bigint | symbol

/**
 * 绑定属性
 *
 * 可选值：
 *   - 对象Record<string, any>：要绑定给元素的属性，`style`|`class`|`className`，会和原有值进行合并。
 *   - 数组[props: Record<string, any>, exclude?: string[]]：第一个元素为要绑定给节点的属性对象，第二个元素可以指定哪些属性不需要绑定。
 */
export type VBind = Record<string, any> | [props: Record<string, any>, exclude?: string[]]

/**
 * 全局属性
 *
 * - `ref`: 用于绑定元素实例。
 * - `key`: 用于绑定元素节点的key。
 * - `v-bind`: 给节点绑定样式。
 */
export interface IntrinsicAttributes {
  /**
   * 控制一个 `Widget` 如何替换树中的另一个 `Widget`。
   *
   * 在运行时，如果两个Widget的`key`相同，则会更新已渲染的Widget，否则会移除旧Widget，然后插入新Widget。
   *
   * 这在某些情况下很有用，例如，当您想重新排序列表时。
   *
   * 通常，作为另一个 Widget 的唯一子项的 Widget 不需要显式键。
   */
  key?: UniqueKey
  /**
   * 引用组件
   */
  ref?: RefEl<any>
  /**
   * 绑定属性
   *
   * 可选值：
   *  - 对象Record<string, any>：要绑定给元素的属性，`style`|`class`|`className`，会和原有值进行合并。
   *  - 数组[props: Record<string, any>, exclude?: string[]]：第一个元素为要绑定给节点的属性对象，
   *  第二个元素可以指定哪些属性不需要绑定。
   */
  'v-bind'?: VBind
  /**
   * 条件渲染，会销毁组件
   */
  'v-if'?: boolean
  'v-else'?: boolean
  'v-else-if'?: boolean
  /**
   * 显示隐藏，不会销毁组件
   */
  'v-show'?: boolean
  [key: string]: any
}
