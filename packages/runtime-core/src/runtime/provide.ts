import type { AnyFunction } from '@vitarx/utils'
import { logger } from '@vitarx/utils'
import type { ComponentInstance } from '../core/index.js'
import { getInstance } from './context.js'

/**
 * 提供依赖数据,实现组件间的依赖注入
 *
 * 注意：依赖组件上下文，仅支持在组件构造阶段使用！
 *
 * @param name - 依赖数据的唯一标识符
 * @param value - 要提供的数据值
 *
 * @example
 * ```ts
 * // 类组件中使用
 * class MyWidget extends Widget {
 *   constructor(props){
 *    super(props)
 *    provide('theme', 'dark');
 *   }
 * }
 * // 函数组件中使用
 * function Foo() {
 *   provide('theme', 'dark');
 *   return <div>...</div>
 * }
 * ```
 */
export function provide(name: string | symbol, value: any): void {
  const ctx = getInstance()
  if (!ctx) {
    logger.error('[provide]：provide must be called in a widget context')
    return void 0
  }
  if (ctx.provide) {
    ctx.provide.set(name, value)
  } else {
    ctx.provide = new Map([[name, value]])
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
 * @returns {T} 注入的数据或默认值
 * @throws {Error} 非组件上下文中调用时抛出错误
 */
export function inject<T>(
  name: string | symbol,
  defaultValue?: T,
  treatDefaultAsFactory?: boolean
): T {
  const ctx = getInstance()
  if (!ctx) {
    throw new Error('inject must be called in widget')
  }

  // 向上查找祖先节点
  let parent: ComponentInstance | null = ctx.parent
  while (parent) {
    if (parent.provide?.has(name)) {
      const value = parent.provide.get(name)
      if (value !== undefined) return value
    }
    parent = parent.parent
  }
  // 尝试从 appContext 中获取数据
  if (ctx.app?.hasProvide(name)) {
    return ctx.app.inject(name, defaultValue)
  }
  // 处理默认值
  if (typeof defaultValue === 'function' && treatDefaultAsFactory) {
    return defaultValue()
  }
  return defaultValue as T
}
