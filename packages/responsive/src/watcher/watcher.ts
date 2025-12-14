import type { VoidCallback } from '@vitarx/utils'
import {
  collectSignal,
  DEP_LINK_HEAD,
  DEP_LINK_TAIL,
  DepLink,
  linkSignalWatcher,
  removeWatcherDeps
} from '../depend/index.js'
import { Effect } from '../effect/index.js'
import type { DebuggerEvent, Signal } from '../types/index.js'
import type { WatchEffectOptions } from './effect.js'
import { queuePostFlushJob, queuePreFlushJob } from './scheduler.js'

export type WatcherCallback<T> = (
  value: T,
  oldValue: T,
  onCleanup: (fn: VoidCallback) => void
) => void

export interface WatcherOptions<T = any> extends WatchEffectOptions {
  immediate?: boolean
  once?: boolean
  dynamicDeps?: boolean
  compare?: (newValue: T, oldValue: T) => boolean
}

/* -------------------------------- scheduler -------------------------------- */

const schedulerMap: Record<'pre' | 'post', (job: () => void) => void> = {
  pre: queuePreFlushJob,
  post: queuePostFlushJob
}

/* --------------------------------- Watcher --------------------------------- */

export class Watcher<T = any> extends Effect implements Watcher {
  /** watcher <-> signal 依赖链表 */
  [DEP_LINK_HEAD]?: DepLink;
  [DEP_LINK_TAIL]?: DepLink
  onTrigger?: (event: DebuggerEvent) => void
  onTrack?: (event: DebuggerEvent) => void
  private readonly _getter: (onCleanup: (fn: VoidCallback) => void) => T
  private readonly _cb?: WatcherCallback<T>

  private _value!: T
  private _isInit = false

  private readonly _compare: (a: T, b: T) => boolean
  private readonly _once: boolean
  private readonly _dynamicDeps: boolean

  private _scheduler?: (job: () => void) => void
  private _cleanups: VoidCallback[] = []

  constructor(
    getter: (onCleanup: (fn: VoidCallback) => void) => T,
    cb?: WatcherCallback<T>,
    options: WatcherOptions<T> = {}
  ) {
    super(options.scope)

    this._getter = getter
    this._cb = cb

    this._compare = options.compare ?? Object.is
    this._once = options.once ?? false
    this._dynamicDeps = options.dynamicDeps ?? true
    if (__DEV__) {
      this.onTrigger = options.onTrigger
      this.onTrack = options.onTrack
    }
    const flush = options.flush ?? 'pre'
    this._scheduler = flush === 'sync' ? undefined : schedulerMap[flush]

    if (options.immediate) this._run()
  }

  /* --------------------------------- runtime -------------------------------- */

  /** signal 触发 */
  trigger(): void {
    if (!this.isActive) return
    if (this._scheduler) {
      this._scheduler(this._run)
    } else {
      this._run()
    }
  }

  protected override beforeDispose(): void {
    this._runCleanups()
  }

  /* ------------------------------- dependency -------------------------------- */

  protected override afterDispose(): void {
    this._scheduler = undefined
    removeWatcherDeps(this)
  }

  /* -------------------------------- cleanups -------------------------------- */

  /** 实际执行 */
  private _run = (): void => {
    if (!this.isActive) return

    // cleanup
    this._runCleanups()

    const newValue = this._collect()
    const oldValue = this._isInit ? this._value : newValue

    this._isInit = true
    this._value = newValue

    if (!this._cb || this._compare(newValue, oldValue)) {
      if (this._once) this.dispose()
      return
    }

    try {
      this._cb(newValue, oldValue, this._registerCleanup)
    } catch (e) {
      if (this._scope) {
        this._scope.handleError(e, 'watcher.callback')
      } else {
        throw e
      }
    }

    if (this._once) this.dispose()
  }

  private _collect(): T {
    // 静态依赖 + 已初始化：不重新收集
    if (!this._dynamicDeps && this._isInit) {
      return this._value
    }

    removeWatcherDeps(this)

    const { result } = collectSignal(() => this._getter(this._registerCleanup), {
      add: (signal: Signal) => linkSignalWatcher(this, signal),
      onTrack: this.onTrack
    })

    return result
  }

  /* ------------------------------ Effect hooks ------------------------------ */

  private _registerCleanup = (fn: VoidCallback): void => {
    this._cleanups.push(fn)
  }

  private _runCleanups(): void {
    for (let i = 0; i < this._cleanups.length; i++) {
      try {
        this._cleanups[i]()
      } catch (e) {
        if (this._scope) {
          this._scope.handleError(e, 'watcher.cleanup')
        } else {
          throw e
        }
      }
    }
    this._cleanups.length = 0
  }
}
