/**
 * 依赖映射集合
 *
 * 键为响应式对象，值为被访问的属性集合
 */
export type DependencyMap = Map<Record<AnyKey, any>, Set<AnyKey>>
/**
 * 收集模式
 *
 * shared：使用全局收集器，多个函数可以共享同一个收集器。
 * exclusive：使用单独的收集器，函数执行期间只收集当前函数的依赖。
 */
export type CollectionMode = 'shared' | 'exclusive'
/** 依赖收集结果 */
export type CollectionResult<T> = {
  /** 函数执行结果 */
  result: T
  /** 收集到的依赖映射 */
  dependencies: DependencyMap
}

/**
 * # 依赖管理器
 *
 * 负责收集和跟踪响应式对象的依赖关系。
 * 当响应式对象的属性被访问时，会自动记录依赖关系。
 */
export class Depend {
  // 全局收集器映射表
  static #collectorRegistry = new Map<symbol, DependencyMap>()
  // 当前活跃的收集器
  static #activeCollector: undefined | DependencyMap

  /**
   * ## 跟踪依赖关系
   *
   * 记录响应式对象的属性访问，建立依赖关系。
   * 通常在响应式系统内部自动调用，无需手动调用。
   *
   * @template T - 跟踪的目标对象类型
   * @param {T} target - 跟踪目标
   * @param {keyof T} property - 被访问的属性
   */
  static track<T extends object>(target: T, property: keyof T): void {
    // 如果有活跃的收集器，优先使用活跃收集器
    if (this.#activeCollector) {
      this.#recordDependency(this.#activeCollector, target, property)
    }
    // 否则使用注册的所有收集器
    else if (this.#collectorRegistry.size) {
      this.#collectorRegistry.forEach(collector => {
        this.#recordDependency(collector, target, property)
      })
    }
  }

  /**
   * ## 收集函数执行过程中的所有依赖
   *
   * 执行提供的函数，并记录其访问的所有响应式对象及其属性。
   *
   * @template T - 函数返回值的类型
   * @param {Function} fn - 要执行的函数
   * @param {CollectionMode} mode - 收集模式，'shared'(共享)或'exclusive'(独占)
   * @returns {CollectionResult<T>} - 包含函数执行结果和依赖映射的对象
   */
  static collect<T>(fn: () => T, mode: 'shared' | 'exclusive' = 'shared'): CollectionResult<T> {
    // 独占模式直接使用专用收集器
    if (mode === 'exclusive') {
      return this.#collectExclusive(fn)
    }

    // 共享模式使用注册表
    const collectorId = Symbol('collector-id')
    const dependencies: DependencyMap = new Map()

    // 注册新收集器
    this.#collectorRegistry.set(collectorId, dependencies)

    try {
      const result = fn()
      return { result, dependencies }
    } finally {
      // 清理收集器
      this.#collectorRegistry.delete(collectorId)
    }
  }

  /**
   * ## 使用独占模式收集依赖
   *
   * 临时禁用其他收集器，专注于收集当前函数的依赖
   *
   * @private
   */
  static #collectExclusive<T>(fn: () => T): CollectionResult<T> {
    const previousCollector = this.#activeCollector
    this.#activeCollector = new Map()

    try {
      const result = fn()
      return { result, dependencies: this.#activeCollector }
    } finally {
      // 恢复之前的收集器
      this.#activeCollector = previousCollector
    }
  }

  /**
   * ## 记录单个依赖关系
   *
   * @private
   */
  static #recordDependency(collector: DependencyMap, target: AnyObject, property: AnyKey): void {
    if (collector.has(target)) {
      // 如果已经收集了该对象，则添加新属性
      collector.get(target)!.add(property as keyof typeof target)
    } else {
      // 否则创建新的属性集合
      collector.set(target, new Set([property as keyof typeof target]))
    }
  }
}
