import { IS_RAW } from '@vitarx/responsive'
import type { CodeLocation, RenderChild } from './view.js'

export type AnyProps = { [k: string]: any }

/**
 * 组件公开实例类型
 */
export type ComponentPublicInstance = {
  readonly [IS_RAW]: true
  readonly [key: keyof any]: any
}
/**
 * 属性验证函数。
 *
 * 用于校验传入的 props 是否符合预期
 *
 * 校验时机：仅开发模式下节点创建之前进行校验
 *
 * 校验结果说明：
 * - `string`：打印警告日志信息。
 * - `false`：打印默认的校验失败信息。
 * - throw new Error('自定义异常')：如果不希望继续渲染组件，则可以抛出异常。
 * - 其他值/void：校验通过。
 *
 * 仅在开发模式下进行校验，生产模式下不会进行校验。
 *
 * @example
 * ```ts
 * defineValidate(MyComponent, (props) => {
 *   if (props.age < 0) {
 *     return 'age cannot be less than 0';
 *   }
 * });
 * ```
 */
export type ValidateProps = (props: AnyProps, location?: CodeLocation) => string | false | unknown

export type Component<P extends AnyProps = any> = {
  /**
   * 组件函数。
   *
   * @param props - 组件属性对象
   * @param [location] - 组件位置信息，仅开发模式下存在
   */
  (props: P, location?: CodeLocation): RenderChild
  /**
   * 定义组件的默认属性。
   *
   * - 在组件实例创建时，`defaultProps` 会自动注入到 `props` 中。
   * - 当外部未传入某个属性时，其默认值通过代理的 `get` 拦截动态返回，
   *   因此 **不会直接合并到 `props` 对象本身**。
   * - 注意：在组件实例中，`props` 是只读的对象：
   *
   * @example
   * ```ts
   * // 函数组件
   * function MyComponent(props: { name?: string; age: number }) {
   *   return <div>{props.name}</div>;
   * }
   * MyComponent.defaultProps = {
   *   age: 18,
   * };
   * ```
   */
  defaultProps?: AnyProps
  /**
   * 属性验证函数。
   *
   * 用于校验传入的 props 是否符合预期
   *
   * 校验时机：仅开发模式下节点创建之前进行校验
   *
   * 校验结果说明：
   * - `string`：打印警告日志信息。
   * - `false`：打印默认的校验失败信息。
   * - throw new Error('自定义异常')：如果不希望继续渲染组件，则可以抛出异常。
   * - 其他值/void：校验通过。
   *
   * 仅在开发模式下进行校验，生产模式下不会进行校验。
   *
   * @example
   * ```ts
   * defineValidate(MyComponent, (props) => {
   *   if (props.age < 0) {
   *     return 'age cannot be less than 0';
   *   }
   * });
   * ```
   *
   * @param props - 传入的组件属性对象
   * @returns {string | false | unknown} 校验结果
   */
  validateProps?: ValidateProps
  /**
   * 组件展示的名称，仅用于调试。
   */
  displayName?: string
}
