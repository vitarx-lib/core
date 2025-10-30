import { VNode } from '../vnode/base/index.js'
import { LifecycleHooks, Widget } from '../widget/index.js'
import type { HostElementInstance } from './element.js'

/**
 * 错误来源联合类型
 *
 * 定义了框架中可能发生错误的各种来源，用于错误处理和调试。
 * 这些来源标识了错误发生的阶段或具体的钩子函数，
 * 帮助开发者定位问题所在。
 *
 * 可能的来源包括：
 * - build: 组件构建阶段
 * - render: 组件渲染阶段
 * - update: 组件更新阶段
 * - effect.${string}: 副作用函数，如 watch、computed 等
 * - hook:${LifecycleHookNames}: 特定的生命周期钩子，如 hook:mounted、hook:updated 等
 */
export type ErrorSource =
  | 'build'
  | 'render'
  | 'update'
  | `effect.${string}`
  | `hook:${Exclude<LifecycleHookNames, 'error'>}`

/**
 * 错误信息对象接口
 *
 * 定义了错误发生时传递给错误处理器的信息对象，
 * 包含错误来源和抛出异常的组件实例，
 * 帮助开发者进行错误定位和处理。
 *
 * @example
 * ```ts
 * // 错误处理器示例
 * function handleError(error: unknown, info: ErrorInfo) {
 *   console.error(`Error in ${info.source}:`, error);
 *   console.log('Component instance:', info.instance);
 * }
 * ```
 */
export interface ErrorInfo {
  /**
   * 错误来源
   */
  source: ErrorSource
  /**
   * 抛出异常的实例
   */
  instance: Widget
}

/**
 * 生命周期钩子名联合类型
 *
 * 定义了所有可用的生命周期钩子名称，这些名称对应 LifecycleHooks 对象的键。
 * 开发者可以使用这些名称来注册和调用特定的生命周期钩子。
 *
 * @example
 * ```ts
 * // 使用生命周期钩子名
 * const hookName: LifecycleHookNames = 'mounted';
 * widget.on(hookName, () => {
 *   console.log('Component mounted');
 * });
 * ```
 */
export type LifecycleHookNames = keyof typeof LifecycleHooks
/**
 * 生命周期钩子方法名联合类型
 *
 * 定义了所有生命周期钩子的方法名，这些名称是字符串字面量形式，
 * 对应 LifecycleHooks 枚举值。这些方法名用于在运行时识别和调用特定的钩子。
 *
 * 与 LifecycleHookNames 不同，此类型直接使用枚举值的字符串形式。
 */
export type LifecycleHookMethods = `${LifecycleHooks}`
/**
 * 生命周期钩子参数类型
 *
 * 根据生命周期钩子的类型，定义了钩子函数需要接收的参数类型。
 * 不同的生命周期钩子有不同的参数需求，这种类型推导确保了参数的类型安全。
 *
 * 具体参数规则：
 * - error 钩子：接收 [error: unknown, info: ErrorInfo] 参数
 * - beforeRemove 钩子：接收 [el: RuntimeElementInstance, types: 'unmount' | 'deactivate'] 参数
 * - 其他钩子：不接收参数（空数组）
 *
 * @template T 生命周期钩子类型
 */
export type LifecycleHookParameter<T> = T extends LifecycleHooks.error
  ? [error: unknown, info: ErrorInfo]
  : T extends LifecycleHooks.beforeRemove
    ? [el: HostElementInstance, type: 'unmount' | 'deactivate']
    : []
/**
 * 生命周期钩子返回值类型
 *
 * 根据生命周期钩子的类型，定义了钩子函数可以返回的值类型。
 * 不同的生命周期钩子有不同的返回值需求，这种类型推导确保了返回值的类型安全。
 *
 * 具体返回值规则：
 * - error 钩子：可以返回 void 或 VirtualNode，用于错误时渲染备用UI
 * - beforeRemove 钩子：可以返回 Promise<void> 或 void，支持异步卸载操作
 * - 其他钩子：只能返回 void
 *
 * @template T 生命周期钩子类型
 */
export type LifecycleHookReturnType<T> = T extends LifecycleHooks.error
  ? VNode | void
  : T extends LifecycleHooks.beforeRemove
    ? Promise<void> | void
    : void

/**
 * 错误处理器类型
 *
 * 定义了错误处理器的函数签名，错误处理器用于捕获和处理组件生命周期中的错误。
 * 错误处理器可以访问组件实例（通过 this），并接收错误对象和错误信息作为参数。
 *
 * 错误处理器可以选择性地返回一个 VirtualNode，用于在错误发生时渲染备用UI。
 *
 * @template T 错误处理器的宿主组件类型，默认为 Widget
 *
 * @example
 * ```tsx
 * function App(){
 *   onError((error, info) => {
 *    console.error(`Error in ${info.source}:`, error);
 *    // 返回备用UI
 *    return <div>Something went wrong</div>;
 *   })
 *   throw new Error('模拟失败');
 * }
 * // 页面会显示 "Something went wrong"
 * ```
 */
export type ErrorHandler<T extends Widget = Widget> = (
  this: T,
  error: unknown,
  info: ErrorInfo
) => void | VNode
