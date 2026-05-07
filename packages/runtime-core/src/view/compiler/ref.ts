import {
  clearEffectLinks,
  hasLinkedSignal,
  IS_READONLY,
  IS_REF,
  IS_SIGNAL,
  onScopeDispose,
  type RefSignal,
  trackEffect,
  trackSignal,
  triggerSignal
} from '@vitarx/responsive'

abstract class ComputedRef<T> implements RefSignal<T, never> {
  readonly [IS_SIGNAL]: true = true
  readonly [IS_REF]: true = true
  readonly [IS_READONLY]: true = true
  public readonly isStatic!: boolean
  protected dirty: boolean = false
  protected cached!: T
  protected constructor() {}
  get value(): T {
    if (this.isStatic) return this.cached
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

  /**
   * 初始化依赖追踪，必须在子类构造器中参数属性赋值后调用。
   *
   * 不能在基类构造器中调用，因为 TypeScript 参数属性
   * （如 `private readonly getter`）在 super() 返回后才赋值，
   * 此时 recompute() 依赖的子类属性尚未初始化。
   */
  protected initTracking(): void {
    this.cached = this.recompute()
    if (hasLinkedSignal(this.effectHandle)) {
      onScopeDispose(() => clearEffectLinks(this.effectHandle), true)
      ;(this as { isStatic: boolean }).isStatic = false
    } else {
      ;(this as { isStatic: boolean }).isStatic = true
    }
  }
  protected abstract recompute(): T
}

/**
 * 表达式计算 Ref
 *
 * 通过追踪 getter 函数的依赖关系，在依赖项变化时自动重新计算值。
 * 无依赖时 isStatic 为 true，读取 value 零开销。
 *
 * @template T getter 返回值类型
 * @param getter 计算函数，其依赖会被自动追踪
 */
export class ExprRef<T> extends ComputedRef<T> {
  private readonly getter: () => T
  constructor(getter: () => T) {
    super()
    this.getter = getter
    this.initTracking()
  }
  protected override recompute(): T {
    return trackEffect(this.getter, this.effectHandle)
  }
}

/**
 * 分支计算 Ref
 *
 * 根据 select 返回的索引执行对应分支函数，索引不变时跳过分支重新执行。
 * 适用于条件渲染等"多路分支、仅一路生效"的场景。
 *
 * @template T 分支函数返回值类型
 * @param select 返回当前应执行的分支索引，无匹配时返回 null
 * @param branches 分支函数数组，每个函数返回对应的计算结果
 */
export class BranchRef<T> extends ComputedRef<T | null> {
  // 使用 -1 作为哨兵值，确保首次 recompute() 一定走分支执行路径。
  // 不能使用 null 作为哨兵，因为 select() 合法返回 null 时
  // 会命中 cachedIndex === null 的缓存判断，返回未初始化的 cached。
  private cachedIndex: number | null = -1
  constructor(
    private readonly select: () => number | null,
    private readonly branches: readonly (() => T)[]
  ) {
    super()
    this.initTracking()
  }

  protected override recompute(): T | null {
    const index = trackEffect(this.select, this.effectHandle)
    if (index === this.cachedIndex) return this.cached
    this.cachedIndex = index
    if (index === null) return null
    if (__VITARX_DEV__ && (index < 0 || index >= this.branches.length)) {
      throw new RangeError(
        `[BranchRef] select() returned index ${index}, but branches length is ${this.branches.length}`
      )
    }
    return this.branches[index]()
  }
}
