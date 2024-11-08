import { getCurrentScope } from '../scope/index.js'

export abstract class LifeCycle {
  protected constructor() {
    const scope = getCurrentScope()
    if (scope) {
      if (this.onDeactivate) {
        scope.onPause(this.onDeactivate.bind(this))
      }
      if (this.onActivated) {
        scope.onUnPause(this.onActivated.bind(this))
      }
      if (this.onUnmounted) {
        scope.onDestroyed(this.onUnmounted.bind(this))
      }
    }
  }
  /**
   * 生命周期钩子
   *
   * `onCreated`钩子会在组件创建后，挂载到dom树前触发，此时el还未渲染，所以不能使用`this.el`，操作真实dom。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  onCreated?(): void

  /**
   * 生命周期构造
   *
   * `onMounted`钩子会在组件挂载到dom树后触发，此时el已经渲染，可以安全使用`this.el`，操作真实dom。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  onMounted?(): void

  /**
   * 生命周期钩子
   *
   * `onDeactivate`钩子会在组件被临时移除时触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  onDeactivate?(): void

  /**
   * 生命周期钩子
   *
   * `onActivated`钩子会在组件被临时移除后，又恢复时触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  onActivated?(): void

  /**
   * 生命周期钩子
   *
   * `onUnmounted`钩子会在组件被销毁时触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  onUnmounted?(): void

  /**
   * 生命周期钩子
   *
   * `onUpdated`钩子会在组件被更新时触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  onUpdated?(): void

  /**
   * 生命周期钩子
   *
   * `onError`钩子会在组件抛出异常时触发，可以返回一个`Vitarx.VNode`做为异常组件显示。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @param {any} error 捕获到的异常
   * @protected
   */
  onError?(error: any): Vitarx.VNode | void
}

/**
 * 生命周期钩子方法
 */
export const lifeCycleHookMethods = [
  'onCreated',
  'onMounted',
  'onDeactivate',
  'onActivated',
  'onUnmounted',
  'onUpdated',
  'onError'
] as const

export type LifeCycleHookNames = (typeof lifeCycleHookMethods)[number]
