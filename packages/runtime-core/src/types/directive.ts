import { ElementView } from '../view/index.js'
import type { HostElement } from './element.js'

export interface DirectiveBinding {
  /**
   * 指令绑定的值
   */
  readonly value: any
  /**
   * 指令绑定的参数
   */
  readonly arg?: string
}
export type DirectiveHook = (el: HostElement, binding: DirectiveBinding, view: ElementView) => void
export interface Directive {
  /** 指令名称，仅用于调试 */
  name?: string
  /**
   * 元素已经创建时调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param view - 节点实例
   */
  created?: DirectiveHook
  /**
   * 元素挂载完成后调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param view - 节点实例
   */
  mounted?: DirectiveHook
  /**
   * 元素即将被销毁
   *
   * 在此方法中清理副作用，避免造成内存泄漏。
   */
  dispose?: DirectiveHook
  /**
   * 获取节点的属性对象，用于服务端渲染
   *
   * 返回的属性对象会和元素的属性对象合并。
   *
   * @param binding - 指令绑定信息对象
   * @param view - 视图节点对象
   * @return {object} 属性对象
   */
  getSSRProps?(binding: DirectiveBinding, view: ElementView): Record<string, any> | void
}

export type DirectiveMap = Map<Directive, DirectiveBinding>
