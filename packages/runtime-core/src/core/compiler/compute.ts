import {
  clearEffectLinks,
  hasLinkedSignal,
  IS_READONLY,
  IS_REF,
  IS_SIGNAL,
  onScopeDispose,
  type RefSignal,
  trackEffectDeps,
  trackSignal,
  triggerSignal
} from '@vitarx/responsive'

/* ----------------------------------------
 * BaseCompute（内部使用，不暴露）
 * ------------------------------------- */

abstract class BaseCompute<T> implements RefSignal<T> {
  readonly [IS_SIGNAL]: true = true
  readonly [IS_REF]: true = true
  readonly [IS_READONLY]: true = true
  public readonly isStatic: boolean
  protected dirty = false
  protected cached!: T
  protected constructor() {
    this.isStatic = this.initTracking()
  }
  get value(): T {
    if (!this.isStatic) return this.cached
    if (this.dirty) {
      this.dirty = false
      this.cached = this.recompute()
    }
    trackSignal(this)
    return this.cached
  }

  protected readonly effectHandle = () => {
    this.dirty = true
    triggerSignal(this)
  }

  protected initTracking(): boolean {
    if (hasLinkedSignal(this.effectHandle)) {
      onScopeDispose(() => clearEffectLinks(this.effectHandle))
      return false
    }
    return true
  }

  protected abstract recompute(): T
}

/**
 * TrackedCompute 是一个带有依赖追踪功能的计算类。
 * 它通过追踪 getter 函数的依赖关系，在依赖项变化时自动重新计算值。
 *
 * 核心功能：
 * - 初始化依赖追踪
 * - 在依赖项变化时自动重新计算值
 *
 * 使用示例：
 * ```typescript
 * const trackedCompute = new TrackedCompute(() => {
 *   return someValue * 2;
 * });
 * ```
 *
 * 构造函数参数：
 * - getter: 用于计算值的函数，该函数的依赖会被自动追踪
 *
 * 使用限制：
 * - getter 函数必须是纯函数，避免产生副作用
 * - 不应手动修改 cached 属性，以免破坏依赖追踪机制
 */
export class TrackedCompute<T = any> extends BaseCompute<T> {
  constructor(private readonly getter: () => T) {
    super()
  }
  protected override initTracking(): boolean {
    this.cached = trackEffectDeps(this.getter, this.effectHandle)
    return super.initTracking()
  }
  protected recompute(): T {
    return trackEffectDeps(this.getter, this.effectHandle)
  }
}

/**
 * 分支计算类，用于根据选择函数的结果动态执行不同的分支函数并返回结果。
 * 该类实现了基于条件选择的多分支计算逻辑，并支持依赖追踪和缓存优化。
 *
 * 核心功能：
 * - 根据选择函数(select)返回的索引值动态执行对应的分支函数(branches)
 * - 自动追踪选择函数的依赖项，当依赖变化时自动重新计算
 * - 缓存最后一次计算的分支索引，避免重复计算相同分支
 *
 * @example
 * ```typescript
 * const branchCompute = new BranchCompute(
 *   () => Math.random() > 0.5 ? 0 : 1, // 选择函数
 *   [() => '结果A', () => '结果B']     // 分支函数数组
 * )
 * console.log(branchCompute.value) // 会根据选择函数返回不同的结果
 * ```
 *
 * @param select - 返回索引值的选择函数，用于决定执行哪个分支
 * @param branches - 只读的分支函数数组，每个函数对应一个可能的计算结果
 *
 * 注意事项：
 * - 选择函数返回的索引值必须在branches数组的有效范围内，否则会导致运行时错误
 * - branches数组是只读的，构造后不能修改
 * - 分支函数的执行结果会被缓存，直到选择函数返回不同的索引值
 */
export class BranchCompute<T = any> extends BaseCompute<T> {
  private cachedIndex = -1

  constructor(
    private readonly select: () => number,
    private readonly branches: readonly (() => T)[]
  ) {
    super()
  }

  protected recompute(): T {
    return this.compute()
  }
  protected override initTracking(): boolean {
    this.cached = this.compute()
    return super.initTracking()
  }
  private compute(): T {
    const index = trackEffectDeps(this.select, this.effectHandle)
    if (index === this.cachedIndex) {
      return this.cached
    }
    this.cachedIndex = index
    return this.branches[index]()
  }
}
