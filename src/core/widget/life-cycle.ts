import { __LifeCycleTrigger__ } from './constant.js'

/** 生命周期钩子枚举 */
export enum LifeCycleHooks {
  created = 'onCreated',
  beforeMount = 'onBeforeMount',
  mounted = 'onMounted',
  deactivate = 'onDeactivate',
  activated = 'onActivated',
  beforeUpdate = 'onBeforeUpdate',
  updated = 'onUpdated',
  error = 'onError',
  unmounted = 'onUnmounted',
  beforeUnmount = 'onBeforeUnmount'
}

/** 生命周期钩子类型 */
export type LifeCycleHookMethods = `${LifeCycleHooks}`;

/**
 * 生命周期基类
 */
export abstract class LifeCycle {
  constructor() {
    // 挂载生命周期钩子
    Object.defineProperty(this, __LifeCycleTrigger__, {
      enumerable: false,
      writable: false,
      value(hook: `${LifeCycleHooks}`, ...args: any[]) {
        return this[hook]?.apply(this, args)
      }
    })
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
  protected onCreated?(): void

  /**
   * 挂载前生命周期钩子
   *
   * `onBeforeMount`钩子会在组件挂载到dom树前触发，此时el还未渲染，所以不能使用`this.el`操作真实dom。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   * @returns {Element | void} 返回一个真实的dom元素，会作为组件的父节点，如果返回`undefined`，则使用默认的父节点。
   */
  protected onBeforeMount?(): void | Element

  /**
   * 生命周期构造
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
  protected onDeactivate?(): void

  /**
   * 生命周期钩子
   *
   * `onActivated`钩子会在组件被临时移除后，又恢复时触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  protected onActivated?(): void

  /**
   * 生命周期钩子
   *
   * `onUnmounted`钩子会在组件被销毁时触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  protected onUnmounted?(): void

  /**
   * 生命周期构造
   *
   * `onBeforeUnmount`钩子会在组件被销毁前触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   * @returns {boolean | void} 返回`true`可告知渲染器`el`销毁逻辑已被接管，渲染器会跳过`el.remove()`。
   */
  protected onBeforeUnmount?(): void | boolean

  /**
   * 生命周期钩子
   *
   * `onBeforeUpdate`钩子会在组件更新之前触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  protected onBeforeUpdate?(): void

  /**
   * 生命周期钩子
   *
   * `onUpdated`钩子会在组件被更新时触发。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @protected
   */
  protected onUpdated?(): void

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
  protected onError?(error: any): Vitarx.VNode | void
}


