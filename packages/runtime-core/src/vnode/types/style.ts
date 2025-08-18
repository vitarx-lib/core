// 假设 RefSignal 是从某个地方导入的类型
import type { RefSignal } from '@vitarx/responsive'
import type { Properties as CssProperties } from 'csstype'

// 基础样式规则类型
type BaseStyleRules = CssProperties<string | number> &
  Partial<Pick<CSSStyleDeclaration, Exclude<keyof CSSStyleDeclaration, keyof CssProperties>>>

/**
 * 支持 RefSignal 的 CSS 样式规则类型
 *
 * @remarks
 * 该类型扩展了基础样式规则，使每个属性值都可以是 RefSignal 类型
 */
export type StyleRules = {
  [K in keyof BaseStyleRules]: BaseStyleRules[K] | RefSignal<NonNullable<BaseStyleRules[K]>>
}

/**
 * CSS样式规则类型
 *
 * @remarks
 * 该类型结合了csstype库的CssProperties类型和DOM原生CSSStyleDeclaration类型。
 * 它包含了所有标准CSS属性，同时也支持浏览器特定的样式属性。
 *
 * @example
 * ```typescript
 * const styles: CssRules = {
 *   display: 'flex',
 *   backgroundColor: '#fff',
 *   WebkitUserSelect: 'none'
 * }
 * ```
 */
export type StyleProperties = string | StyleRules
/**
 * HTML元素的class属性值类型
 *
 * @remarks
 * 该类型支持多种形式的class定义：
 * - 字符串：单个或多个以空格分隔的类名
 * - 字符串数组：多个类名的数组
 * - 对象：键为类名，值为布尔值，表示是否应用该类
 *
 * @example
 * ```typescript
 * // 字符串形式
 * const class1: ClassProperties = 'btn btn-primary'
 *
 * // 数组形式
 * const class2: ClassProperties = ['btn', 'btn-primary']
 *
 * // 对象形式
 * const class3: ClassProperties = {
 *   btn: true,
 *   'btn-primary': true,
 *   'btn-large': false
 * }
 * ```
 */
export type ClassProperties = string | string[] | Record<string, boolean>
