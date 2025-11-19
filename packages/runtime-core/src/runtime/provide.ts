import type { AnyFunction } from '@vitarx/utils'
import type { VNode } from '../types/index.js'
import { isStatefulWidgetNode } from '../utils/vnode.js'
import { findParentNode } from '../vnode/index.js'
import { getCurrentVNode } from './context.js'

/**
 * 提供依赖数据,实现小部件间的依赖注入
 *
 * 注意：依赖有状态的组件上下文，仅支持在有状态函数/类组件初始化阶段使用！！！
 *
 * @param name - 依赖数据的唯一标识符
 * @param value - 要提供的数据值
 * @throws {Error} 当不在有状态小部件上下文中调用时抛出错误
 *
 * @example
 * ```ts
 * // 类组件
 * class MyWidget extends Widget {
 *   onCreate() {
 *    provide('theme', 'dark');
 *   }
 * }
 * // 函数组件
 * function Foo() {
 *   provide('theme', 'dark');
 *   return <div>...</div>
 * }
 * ```
 */
export function provide(name: string | symbol, value: any): void {
  const currentVNode = getCurrentVNode()
  if (!isStatefulWidgetNode(currentVNode)) {
    throw new Error('provide must be called in stateful widget')
  }
  if (!currentVNode.injectionStore) {
    currentVNode.injectionStore = new Map([[name, value]])
  } else {
    currentVNode.injectionStore.set(name, value)
  }
}

/**
 * 注入依赖数据 - 基本用法
 *
 * 注意：依赖组件上下文，仅支持在组件初始化阶段使用！！！
 *
 * @template T - 注入数据的类型
 * @param name - 依赖数据的唯一标识符
 */
export function inject<T>(name: string | symbol): T | undefined

/**
 * 注入依赖数据 - 带默认值
 *
 * 注意：依赖组件上下文，仅支持在组件初始化阶段使用！！！
 *
 * @template T - 注入数据的类型
 * @param name - 依赖数据的唯一标识符
 * @param defaultValue - 默认值
 */
export function inject<T>(name: string | symbol, defaultValue: T): T

/**
 * 注入依赖数据 - 明确指定默认值不作为工厂函数
 *
 * 注意：依赖组件上下文，仅支持在组件初始化阶段使用！！！
 *
 * @template T - 注入数据的类型
 * @param name - 依赖数据的唯一标识符
 * @param defaultValue - 默认值
 * @param treatDefaultAsFactory - 是否将默认值作为工厂函数
 */
export function inject<T>(name: string | symbol, defaultValue: T, treatDefaultAsFactory: false): T

/**
 * 注入依赖数据 - 默认值作为工厂函数
 *
 * 注意：依赖组件上下文，仅支持在组件初始化阶段使用！！！
 *
 * @template T - 函数类型
 * @param name - 依赖数据的唯一标识符
 * @param defaultValue - 工厂函数
 * @param treatDefaultAsFactory - 是否将默认值作为工厂函数
 */
export function inject<T extends AnyFunction>(
  name: string | symbol,
  defaultValue: T,
  treatDefaultAsFactory: true
): ReturnType<T>

/**
 * 注入祖先组件提供的依赖数据
 *
 * @template T - 注入数据的类型
 * @param name - 依赖数据的唯一标识符
 * @param defaultValue - 默认值或工厂函数
 * @param treatDefaultAsFactory - 是否将默认值作为工厂函数,默认为 false
 * @returns 注入的数据或默认值
 * @throws {Error} 当不在小部件上下文中调用时抛出错误
 */
export function inject<T>(
  name: string | symbol,
  defaultValue?: T,
  treatDefaultAsFactory?: boolean
): T {
  const currentVNode = getCurrentVNode()
  if (!currentVNode) {
    throw new Error('inject must be called in widget')
  }

  // 向上查找祖先节点
  let parentNode: VNode | undefined = findParentNode(currentVNode)
  while (parentNode) {
    if (isStatefulWidgetNode(parentNode) && parentNode.injectionStore?.has(name)) {
      return parentNode.injectionStore.get(name) as T
    }
    parentNode = findParentNode(parentNode)
  }

  // 处理默认值
  if (typeof defaultValue === 'function' && treatDefaultAsFactory) {
    return defaultValue()
  }
  return defaultValue as T
}
