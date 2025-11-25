/**
 * 测试 Widget 创建辅助函数
 *
 * 提供快速创建测试用 Widget 的工具函数
 */

import type { ClassWidget, VNodeChild } from '../../src/index.js'
import { createVNode, Widget } from '../../src/index.js'

/**
 * 创建测试用的有状态 Widget 类
 *
 * @param options 配置选项
 * @returns Widget 类
 */
export function createTestWidget<P extends Record<string, any> = Record<string, any>>(
  options?: Partial<Widget>
): ClassWidget<P> {
  /**
   * TestWidget 类，继承自 Widget 基类
   * 该类重写了 Widget 的生命周期方法和构建方法
   * @param P 泛型参数，表示 Widget 的属性类型
   */
  return class TestWidget extends Widget<P> {
    // 重写 onCreate 生命周期方法，从 options 中获取对应的回调函数
    override onCreate = options?.onCreate
    // 重写 onBeforeMount 生命周期方法，从 options 中获取对应的回调函数
    override onBeforeMount = options?.onBeforeMount
    // 重写 onMounted 生命周期方法，从 options 中获取对应的回调函数
    override onMounted = options?.onMounted
    // 重写 onBeforeUpdate 生命周期方法，从 options 中获取对应的回调函数
    override onBeforeUpdate = options?.onBeforeUpdate
    // 重写 onUpdated 生命周期方法，从 options 中获取对应的回调函数
    override onUpdated = options?.onUpdated
    // 重写 onBeforeUnmount 生命周期方法，从 options 中获取对应的回调函数
    override onBeforeUnmount = options?.onBeforeUnmount
    // 重写 onUnmounted 生命周期方法，从 options 中获取对应的回调函数
    override onUnmounted = options?.onUnmounted
    // 重写 onActivated 生命周期方法，从 options 中获取对应的回调函数
    override onActivated = options?.onActivated
    // 重写 onDeactivated 生命周期方法，从 options 中获取对应的回调函数
    override onDeactivated = options?.onDeactivated
    // 重写 onError 生命周期方法，从 options 中获取对应的回调函数
    override onError = options?.onError

    /**
     * 重写 build 方法，用于构建虚拟 DOM
     * @returns 返回 VNodeChild 类型的虚拟 DOM 节点
     */
    override build(): VNodeChild {
      // 如果 options 中提供了 build 方法，则调用它；否则创建一个空的 div 元素
      return options?.build ? options?.build.call(this) : createVNode('div')
    }
  }
}
