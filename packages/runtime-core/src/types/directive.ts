import type { HostElements } from './element.js'
import type { VNode } from './nodes/index.js'

export interface DirectiveBinding {
  /**
   * 传递给指令的值
   */
  value: any
  /**
   * 之前的值
   *
   * 仅在updated/beforeUpdate中可用。
   */
  oldValue: any
  /**
   * 传递给指令的参数
   *
   * @example
   * ```jsx
   * <div v-directive:arg="value" />
   * ```
   */
  arg: string | undefined
}
export interface DirectiveOptions {
  /**
   * 节点元素创建完成后调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param node - 节点实例
   */
  created?(el: HostElements, binding: DirectiveBinding, node: VNode): void
  /**
   * 节点元素即将被挂载到DOM前调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param node - 节点实例
   */
  beforeMount?(el: HostElements, binding: DirectiveBinding, node: VNode): void
  /**
   * 节点元素被真实挂载到DOM后调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param node - 节点实例
   */
  mounted?(el: HostElements, binding: DirectiveBinding, node: VNode): void
  /**
   * 节点元素即将被更新前调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param node - 节点实例
   */
  beforeUpdate?(el: HostElements, binding: DirectiveBinding, node: VNode): void
  /**
   * 节点元素被更新后调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param node - 节点实例
   */
  updated?(el: HostElements, binding: DirectiveBinding, node: VNode): void
  /**
   * 节点元素即将被卸载前调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param node - 节点实例
   */
  beforeUnmount?(el: HostElements, binding: DirectiveBinding, node: VNode): void
  /**
   * 节点元素被卸载后调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param node - 节点实例
   */
  unmounted?(el: HostElements, binding: DirectiveBinding, node: VNode): void
  /**
   * 获取节点的属性对象，用于服务端渲染
   *
   * 返回的属性对象会和元素的属性对象合并。
   *
   * @param binding - 绑定信息对象
   * @param node - 节点对象
   * @return {object} 属性对象
   */
  getSSRProps?(binding: DirectiveBinding, node: VNode): Record<string, any> | void
}
export interface Directive extends DirectiveOptions {
  /**
   * 指令名称
   */
  name: string
}
