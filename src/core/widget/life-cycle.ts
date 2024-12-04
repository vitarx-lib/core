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
/** 错误信息类型 */
export type ErrorInfo = 'build' | 'render'
/**
 * 生命周期基类
 */
export abstract class LifeCycle {
  protected constructor() {
    // 定义一个__LifeCycleTrigger__属性，用于触发生命周期钩子的入口函数，方便管理
    Object.defineProperty(this, __LifeCycleTrigger__, {
      enumerable: false,
      writable: false,
      value(hook: LifeCycleHookMethods, ...args: any[]): any {
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
   * @returns {Element | void} 返回一个真实的dom元素，会作为组件的父节点，如果返回`undefined`，则使用默认的父节点。
   * @protected
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
   * ## 生命周期构造
   *
   * `onBeforeUnmount`钩子会在组件被销毁前触发，此时`el`还未从`DOM`树中移除，可以返回一个`true`接管`el`的销毁逻辑。
   *
   * 关于`el`销毁逻辑接管的一些考虑：
   *
   * 1. 如果返回`true`，则`el`销毁逻辑由开发者自行接管，此时`el`不会从`DOM`树中移除，需要开发者则执行完逻辑后移除`el`。
   * 2. 如果返回其他值，则渲染器内部会自动处理`el`的销毁逻辑。
   * 3. 请务必判断`root`参数是否为`true`，不是true时请不要对`el`进行任何操作，这可能会导致布局混乱，以及性能浪费，因为它的祖父节点会在随后立即从dom树移除。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   * @param {boolean} root 如果为true则代表卸载的正是当前节点，如果为false则卸载的是父节点。
   * @returns {boolean | void} 返回`true`可告知渲染器`el`销毁逻辑已被接管，渲染器会跳过`el.remove()`。
   * @protected
   */
  protected onBeforeUnmount?(root: boolean): void | boolean

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
   * `onError`钩子会在组件渲染或构建时抛出异常，可以返回一个`Vitarx.Element`做为备用展示。
   *
   * @note 该方法是受保护的，由`Vitarx`内部调用，请勿外部调用。
   *
   * @param {unknown} error - 捕获到的异常对象
   * @param {ErrorInfo} info - 捕获异常的阶段，可以是`build`或`render`
   * @protected
   */
  protected onError?(error: unknown, info: ErrorInfo): Vitarx.Element | void
}


