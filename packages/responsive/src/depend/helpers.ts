import { type CollectionResult, Depend } from './depend'

/**
 * ## 跟踪依赖关系
 *
 * 手动记录响应式对象的属性访问。
 * 通常在响应式系统内部自动调用，仅在特殊情况下需要手动调用。
 *
 * @template T - 目标对象的类型
 * @param target - 要跟踪的目标对象
 * @param property - 被访问的属性
 * @example
 * ```ts
 * // 创建一个响应式对象
 * const user = { name: 'Alice', age: 25 }
 *
 * // 手动跟踪对象属性的访问
 * depTrack(user, 'name') // 跟踪 name 属性的访问
 * depTrack(user, 'age')  // 跟踪 age 属性的访问
 *
 * // 在特殊场景下使用，比如自定义响应式系统
 * class CustomProxy {
 *   get(target: object, property: string) {
 *     depTrack(target, property) // 在getter中跟踪属性访问
 *     return target[property]
 *   }
 * }
 * ```
 */
export function depTrack<T extends object>(target: T, property: keyof T): void {
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
 * @example
 * ```ts
 * // 创建响应式对象
 * const user = { name: 'Alice', age: 25 }
 * const profile = { bio: 'Developer' }
 *
 * // 使用共享模式收集依赖（默认模式）
 * const { result, dependencies } = depCollect(() => {
 *   console.log(user.name, profile.bio)
 *   return user.age
 * })
 * // result: 25
 * // dependencies: Map { user => Set {'name', 'age'}, profile => Set {'bio'} }
 *
 * // 使用独占模式收集依赖
 * const exclusive = depCollect(
 *   () => user.name + ' - ' + profile.bio,
 *   'exclusive'
 * )
 * // 独占模式下，只收集当前函数的依赖，不受其他收集器影响
 * ```
 */
export function depCollect<T>(
  fn: () => T,
  mode: 'shared' | 'exclusive' = 'shared'
): CollectionResult<T> {
  return Depend.collect(fn, mode)
}
