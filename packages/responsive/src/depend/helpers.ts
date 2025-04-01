import { type AnyKey, type CollectionResult, Depend } from './depend'

/**
 * ## 跟踪依赖关系
 *
 * 手动记录响应式对象的属性访问。
 * 通常在响应式系统内部自动调用，仅在特殊情况下需要手动调用。
 *
 * @param target - 响应式对象
 * @param property - 被访问的属性
 */
export function depTrack(target: AnyObject, property: AnyKey): void {
  Depend.track(target, property)
}

/**
 * ## 收集函数依赖
 *
 * 执行函数并收集其中访问的所有响应式依赖。
 *
 * @param fn - 要执行的函数
 * @param mode - 收集模式，'shared' (共享) 或 'exclusive' (独占)
 * @returns - 包含函数执行结果和依赖映射的对象
 */
export function depCollect<T>(
  fn: () => T,
  mode: 'shared' | 'exclusive' = 'shared'
): CollectionResult<T> {
  return Depend.collect(fn, mode)
}
