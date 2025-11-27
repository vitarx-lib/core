/**
 * 测试 Widget 创建辅助函数
 *
 * 提供快速创建测试用 Widget 的工具函数
 */

import { Scheduler } from '@vitarx/responsive'
import {
  type ClassWidget,
  createVNode,
  mountNode,
  type Renderable,
  renderNode,
  type VNodeInstanceType,
  Widget,
  type WidgetTypes,
  type WidgetVNode
} from '../../src/index.js'

/**
 * 创建测试用的有状态 Widget 类
 *
 * @param options 配置选项
 * @returns Widget 类
 */
export function createTestWidget<P extends Record<string, any> = Record<string, any>>(
  options?: Partial<Widget<P>>
): ClassWidget<P> {
  /**
   * TestWidget 类，继承自 Widget 基类
   * 该类重写了 Widget 的生命周期方法和构建方法
   * @param P 泛型参数，表示 Widget 的属性类型
   */
  return class TestWidget extends Widget<P> {
    override onCreate = options?.onCreate
    override onBeforeMount = options?.onBeforeMount
    override onMounted = options?.onMounted
    override onBeforeUpdate = options?.onBeforeUpdate
    override onUpdated = options?.onUpdated
    override onBeforeUnmount = options?.onBeforeUnmount
    override onUnmounted = options?.onUnmounted
    override onActivated = options?.onActivated
    override onDeactivated = options?.onDeactivated
    override onError = options?.onError
    override onRender = options?.onRender
    override $patchUpdate = options?.$patchUpdate

    override build(): Renderable {
      return options?.build ? options?.build.call(this) : createVNode('div')
    }
  }
}

/**
 * 创建异步组件
 *
 * @param widget 组件类型
 * @param delay 延迟时间（毫秒）
 * @returns 返回异步组件的 Promise
 */
export function createAsyncWidget<T extends WidgetTypes>(
  widget: T,
  delay: number = 0
): Promise<{ default: T }> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ default: widget })
    }, delay)
  })
}

/**
 * 等待异步任务完成
 *
 * @param ms 等待时间（毫秒）
 */
export function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 创建 DOM 容器
 *
 * @returns 返回 DOM 容器元素
 */
export function createContainer(): HTMLElement {
  return document.createElement('div')
}

/**
 * 刷新调度器队列
 *
 * 同步执行所有待处理的更新任务
 */
export function flushScheduler(): void {
  Scheduler.flushSync()
}

/**
 * 渲染并挂载组件到容器
 *
 * @param widget 组件类型
 * @param props 组件属性
 * @param container 容器元素，不传则自动创建
 * @returns 返回容器元素
 */
export function renderAndMount<T extends WidgetTypes>(
  widget: T,
  props?: any,
  container?: HTMLElement
): VNodeInstanceType<T> {
  const vnode = createVNode(widget, props)
  const el = container || createContainer()
  renderNode(vnode)
  mountNode(vnode, el)
  return vnode
}

/**
 * 更新组件属性并触发重新渲染
 * @param node 虚拟DOM节点对象
 * @param key 要更新的属性名
 * @param value 新的属性值
 */
export function updateProps(node: WidgetVNode, key: string, value: any): void {
  // 更新节点的属性值
  node.props[key] = value
  // 通知运行时实例进行更新
  node.runtimeInstance!.update()
  // 刷新调度器，确保所有更新按顺序执行
  flushScheduler()
}
