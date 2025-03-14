import type { ContainerElement, VDocumentFragment } from '../renderer/index.js'
import type { Widget } from './widget.js'

/**
 * 目标容器元素
 */
export type TargetContainerElement = Exclude<ContainerElement, VDocumentFragment>

/** 生命周期钩子枚举 */
export enum LifeCycleHooks {
  created = 'onCreated',
  beforeMount = 'onBeforeMount',
  mounted = 'onMounted',
  deactivated = 'onDeactivated',
  activated = 'onActivated',
  beforeUpdate = 'onBeforeUpdate',
  updated = 'onUpdated',
  error = 'onError',
  unmounted = 'onUnmounted',
  beforeUnmount = 'onBeforeUnmount',
  beforeRemove = 'onBeforeRemove'
}

/**
 * 生命周期钩子名联合类型
 */
export type LifeCycleHookNames = keyof typeof LifeCycleHooks
/**
 * 生命周期钩子方法名联合类型
 */
export type LifeCycleHookMethods = `${LifeCycleHooks}`

/**
 * 错误来源联合类型
 */
export type ErrorSource =
  | 'build'
  | 'render'
  | 'update'
  | 'listener'
  | `hook:${Exclude<LifeCycleHookNames, 'error'>}`

/**
 * 错误信息对象接口
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
 * 生命周期钩子需要接收的参数
 */
export type HookParameter<T> = T extends LifeCycleHooks.error
  ? [error: unknown, info: ErrorInfo]
  : T extends LifeCycleHooks.beforeRemove
    ? [el: ContainerElement, type: 'unmount' | 'deactivate']
    : []

/**
 * 生命周期钩子返回值类型
 */
export type HookReturnType<T> = T extends LifeCycleHooks.beforeMount
  ? void | TargetContainerElement
  : T extends LifeCycleHooks.error
    ? any
    : T extends LifeCycleHooks.beforeRemove
      ? Promise<void> | void
      : void

/**
 * 生命周期基类
 */
export abstract class LifeCycle {
  /**
   * 生命周期钩子
   *
   * `onCreated`钩子会在组件创建后，挂载到dom树前触发，此时el还未渲染，所以不能使用`this.el`，操作真实dom。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  protected onCreated?(): void

  /**
   * 挂载前生命周期钩子
   *
   * `onBeforeMount`钩子会在组件挂载到dom树前触发，此时el还未渲染，所以不能使用`this.el`操作真实dom。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @returns {TargetContainerElement | void} 返回一个真实的dom元素，会作为组件的父节点，如果返回`undefined`，则使用默认的父节点。
   * @protected
   */
  protected onBeforeMount?(): void | TargetContainerElement

  /**
   * 生命周期构子
   *
   * `onMounted`钩子会在组件挂载到dom树后触发，此时el已经渲染，可以安全使用`this.el`，操作真实dom。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  protected onMounted?(): void

  /**
   * 生命周期钩子
   *
   * `onDeactivate`钩子会在组件被临时移除时触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  protected onDeactivated?(): void

  /**
   * 生命周期钩子
   *
   * `onActivated`钩子会在组件激活后触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  protected onActivated?(): void

  /**
   * 生命周期钩子
   *
   * `onUnmounted`钩子会在组件被销毁后触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  protected onUnmounted?(): void

  /**
   * 生命周期构子
   *
   * `onBeforeUnmount`钩子会在组件被销毁前触发，此时视图还保持响应式。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @protected
   */
  protected onBeforeUnmount?(): void

  /**
   * 生命周期钩子
   *
   * `onBeforeUpdate`钩子会在组件更新之前触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @protected
   */
  protected onBeforeUpdate?(): void

  /**
   * 生命周期钩子
   *
   * `onUpdated`钩子会在组件被更新时触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @protected
   */
  protected onUpdated?(): void

  /**
   * 生命周期钩子
   *
   * `onError`钩子会在组件渲染或构建时抛出异常，可以返回一个`Vitarx.Element`虚拟节点做为备用展示。
   *
   * info值说明：
   *  - source: 错误来源，可以是`build`、`render`、`hook:xxx`...
   *  - instance: 发生错误的组件实例
   *
   * @param {unknown} error - 捕获到的异常对象
   * @param {ErrorInfo} info - 错误信息对象
   * @returns {any} build/render错误时支持返回备用元素，返回其他非`undefined`值，表示异常已被处理，不再向上抛出。
   * @internal 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @protected
   */
  protected onError?(error: unknown, info: ErrorInfo): any

  /**
   * 元素从`DOM`树移除之前触发的钩子
   *
   * 仅在unmount、deactivate之前被调用
   *
   * 淡出动画示例：
   * ```ts
   * return new Promise((resolve) => {
   *   this.el.style.opacity = 0 // 设置元素透明度
   *   setTimeout(resolve, 300) // 假设css动画时间是300ms，延迟300ms后移除元素
   * })
   * ```
   *
   * @param {ContainerElement} el - 当前小部件的根元素。
   * @param {string | 'unmount' | 'deactivate'} type - 触发类型`unmount`|`deactivate`。
   * @returns {Promise<void>} 返回一个Promise，渲染器会等待其运行完成后再移除根元素。
   * @protected
   */
  protected onBeforeRemove?<T extends ContainerElement>(
    el: T,
    type: 'unmount' | 'deactivate'
  ): Promise<void>
}
