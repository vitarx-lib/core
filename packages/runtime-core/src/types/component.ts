import { IS_RAW } from '@vitarx/responsive'
import type { RequiredKeys } from '@vitarx/utils'
import type { ValidChild } from './view.js'

export type AnyProps = { [k: string]: any }

/**
 * 组件公开实例类型
 */
export type ComponentPublicInstance = {
  readonly [IS_RAW]: true
  readonly [key: string]: any
}

export type Component<P extends AnyProps = any> = {
  (props: P): ValidChild
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
   * - `string`：校验失败但不影响节点运行，打印该自定义异常提示。
   * - `false`：打印默认的参数错误信息。
   * - throw new Error('自定义异常')：如果不希望继续渲染组件，则可以抛出异常，异常将会由父级捕获并处理。
   * - 其他值/void：校验通过。
   *
   * 框架在开发模式下会自动捕获异常并将其转换为校验错误。
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
  validateProps?: (props: AnyProps) => string | false | unknown
  /**
   * 组件展示的名称，仅用于调试。
   */
  displayName?: string
}

/**
 * 带默认值的属性类型
 *
 * 根据默认值定义 D，将属性类型 P 中具有默认值的属性转换为可选属性。
 * 这对于组件的 defaultProps 特别有用，可以自动将具有默认值的属性标记为可选。
 *
 * 如果默认值定义 D 是属性类型 P 的部分类型，则将 D 中存在的属性转换为可选属性；
 * 否则，保持原始属性类型不变。
 *
 * @template P - 原始属性类型
 * @template D - 默认值定义类型
 *
 * @example
 * ```ts
 * interface ButtonProps {
 *   text: string;
 *   disabled: boolean;
 *   size: 'small' | 'medium' | 'large';
 * }
 *
 * // 组件默认值定义
 * const defaultProps = {
 *   disabled: false,
 *   size: 'medium'
 * };
 *
 * // 使用 WithDefaultProps 转换属性类型
 * type ButtonPropsWithDefaults = WithDefaultProps<ButtonProps, typeof defaultProps>;
 * // 等价于:
 * // {
 * //   text: string; // 必需属性
 * //   disabled?: boolean; // 可选属性，因为有默认值
 * //   size?: 'small' | 'medium' | 'large'; // 可选属性，因为有默认值
 * // }
 * ```
 */
type WithDefaultProps<P extends AnyProps, D extends AnyProps | undefined> = D extends undefined
  ? P
  : Omit<P, keyof D> & {
      [K in keyof D as K extends keyof P ? K : never]?: K extends keyof P ? P[K] : never
    }
/**
 * 组件props类型重载
 */
export type ComponentProps<T extends Component> =
  T extends Component<infer P>
    ? 'defaultProps' extends RequiredKeys<T>
      ? WithDefaultProps<P, T['defaultProps']>
      : P
    : {}
