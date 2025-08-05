import type { Properties as CssProperties } from 'csstype'

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
export type StyleRules = CssProperties &
  Partial<Pick<CSSStyleDeclaration, Exclude<keyof CSSStyleDeclaration, keyof CssProperties>>>
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
