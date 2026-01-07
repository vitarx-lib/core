import {
  type DisposableEffect,
  EffectScope,
  type EffectScopeOptions,
  getActiveScope
} from './scope.js'
import { OWNER_SCOPE } from './symbol.js'

/**
 * 创建一个作用域实例
 *
 * @param options - 作用域的配置选项
 * @returns {EffectScope} - 返回创建的EffectScope实例
 */
export function createScope(options?: EffectScopeOptions): EffectScope {
  return new EffectScope(options)
}

/**
 * 获取给定effect的作用域
 * @param effect - 需要获取作用域的effect对象
 * @returns - 返回effect对应的作用域对象，如果不存在则返回undefined
 */
export const getOwnerScope = (effect: DisposableEffect): EffectScope | undefined =>
  effect[OWNER_SCOPE]

/**
 * 向当前作用域添加一个副作用函数
 * @param effect - 要添加的副作用函数，类型为EffectLike
 */
export const addToActiveScope = (effect: DisposableEffect): void => {
  // 获取当前活跃的作用域
  const activeScope = getActiveScope()
  // 如果存在活跃作用域，则将副作用函数添加到该作用域中
  activeScope?.add(effect)
}

/**
 * 从当前作用域中移除指定的副作用函数
 * @param effect - 需要移除的副作用函数对象，必须符合EffectLike接口
 */
export const removeFromOwnerScope = (effect: DisposableEffect): void => {
  // 获取副作用函数绑定的当前作用域
  const currentScope = effect[OWNER_SCOPE]
  // 如果存在当前作用域，则从作用域中移除该副作用函数
  // 使用可选链操作符确保在currentScope为undefined时不会报错
  currentScope?.remove(effect)
}

/**
 * 处理effect错误的函数
 *
 * @param effect - 需要处理的effect对象
 * @param e - 发生的未知错误
 * @param source - 错误来源的字符串描述
 */
export const reportEffectError = (effect: DisposableEffect, e: unknown, source: string): void => {
  // 检查effect是否存在当前作用域
  if (effect[OWNER_SCOPE]) {
    // 如果存在当前作用域，则调用该作用域的错误处理方法
    effect[OWNER_SCOPE]?.handleError(e, source)
  } else {
    // 如果不存在当前作用域，则直接抛出错误
    throw e
  }
}
