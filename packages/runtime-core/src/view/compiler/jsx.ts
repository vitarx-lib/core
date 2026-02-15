import { hasPropTrack, isRef, toRef } from '@vitarx/responsive'
import { isFunction } from '@vitarx/utils'
import type { CodeLocation } from '../../types/index.js'
import { DynamicView } from '../implements/index.js'
import { SwitchViewSource } from './source.js'

/**
 * 处理条件渲染表达式
 *
 * @internal
 * @param select - 选择器函数，用于决定执行哪个分支
 * @param branches - 分支函数数组，每个函数返回一个计算值
 * @param location - 代码位置
 * @returns {DynamicView} - 切换视图
 */
export function switchExpressions(
  select: () => number | null,
  branches: (() => unknown)[],
  location?: CodeLocation
): DynamicView {
  return new DynamicView(new SwitchViewSource(select, branches), location)
}

/**
 * 处理成员表达式，根据对象的属性返回相应的值或视图
 *
 * @internal
 * @param obj - 要处理的对象，必须是 object 类型
 * @param key - 对象的属性键，必须是 obj 的键之一
 * @param location - 代码位置
 * @returns 返回属性值或 DynamicView 视图对象
 */
export function memberExpressions<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  location?: CodeLocation
): T[K] | DynamicView<T[K]> {
  // 检查对象是否有属性跟踪
  const { value, isTrack } = hasPropTrack(obj, key)
  // 不需要跟踪直接返回
  if (!isTrack) return value
  // 如果值是函数，则直接返回该函数
  if (isFunction(value)) return value
  const source = key === 'value' && isRef(obj) ? obj : toRef(obj, key)
  return new DynamicView<T[K]>(source, location)
}
