import type { EffectInterface } from './effect-interface.js'
import { EffectScope, type EffectScopeOptions } from './effect-scope.js'

/**
 * ## 创建作用域
 *
 * 创建一个新的作用域实例，用于管理和控制副作用的生命周期。
 *
 * @param {EffectScopeOptions} options - 作用域配置项
 * @param {string | symbol} [options.name = "anonymous"] - 作用域名称，用于调试时识别作用域
 * @param {boolean} [options.attachToCurrentScope = false] - 是否将当前作用域附加到父级作用域
 * @param {(error: unknown) => void} [options.errorHandler] - 错误处理器，用于处理作用域内的异常
 * @returns {EffectScope} 返回作用域实例
 * @throws {TypeError} 当errorHandler不是函数类型时抛出
 */
export const createScope = (options?: EffectScopeOptions): EffectScope => {
  return new EffectScope(options)
}

/**
 * ## 获取当前作用域
 *
 * 获取当前上下文中的作用域实例。此函数通常用于以下场景：
 * 1. 在组件或函数中获取当前的作用域上下文
 * 2. 在创建新的副作用对象时获取父级作用域
 * 3. 在异步操作中维护作用域上下文
 *
 * @remarks
 * - 如果在组件中使用，请勿手动销毁获取到的作用域
 * - 如果在异步操作中使用，需配合`withAsyncContext`确保上下文正确
 *
 * @returns {EffectScope|undefined} 返回当前作用域实例，如果不存在则返回undefined
 * @alias useCurrentScope
 */
export const getCurrentScope = (): EffectScope | undefined => {
  return EffectScope.getCurrentScope()
}

export { getCurrentScope as useCurrentScope }

/**
 * ## 往作用域中添加一个副作用对象
 *
 * 将实现了EffectInterface接口的副作用对象添加到当前作用域中进行管理。
 * 添加后的副作用对象将：
 * 1. 自动继承作用域的错误处理
 * 2. 在作用域销毁时被自动清理
 * 3. 随作用域一起暂停和恢复
 *
 * @param {EffectInterface} effect - 要添加的副作用对象
 * @returns {boolean} 添加是否成功。当前作用域不存在或已销毁时返回false
 * @throws {TypeError} 当effect不是有效的副作用对象时抛出
 */
export const addEffect = (effect: EffectInterface): boolean => {
  return !!getCurrentScope()?.addEffect(effect)
}
