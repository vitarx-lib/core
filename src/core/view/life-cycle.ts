export abstract class LifeCycle {
  /**
   * 组件被创建时触发
   */
  protected onCreated?(): void

  /**
   * 成功挂载到dom树上后触发
   */
  protected onMounted?(): void

  /**
   * 组件被临时移除时调用。
   */
  protected onDeactivate?(): void

  /**
   * 组件被临时移除后又恢复时触发
   */
  protected onActivated?(): void

  /**
   * 组件被销毁时触发
   *
   * @protected
   */
  protected onUnmounted?(): void

  /**
   * 视图被更新时触发
   *
   * @protected
   */
  protected onUpdated?(): void

  /**
   * 子组件抛出异常时触发，可以返回一个`Vitarx.VNode`做为异常组件显示
   *
   * @param {Error} error 错误对象
   */
  protected onError?(error: Error): Vitarx.VNode | void
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
