import { clearEffectLinks, hasLinkedSignal, queueJob, trackEffectDeps } from '@vitarx/responsive'

export type ViewEffect = {
  (): void
  pause: () => void
  resume: () => void
}
/**
 * 用于执行一个视图副作用函数，
 * 主要服务于视图运行时，如视图更新调度，业务层副作用谨慎使用！
 *
 * @warning - ⚠️ 需在合适的时机主动销毁副作用，否则可能会造成内存泄露。
 * @internal - 仅限视图运行时使用
 * @param effect - 要执行的副作用函数
 * @returns { ViewEffect | null } 副作用存在信号依赖则返回视图副作用句柄函数，否则返回 NULL
 */
export function viewEffect(effect: () => void): ViewEffect | null {
  let isActivated: boolean = true
  let dirty: boolean = false
  const handle = () => {
    if (!isActivated) {
      dirty = true
    } else {
      queueJob(effect)
    }
  }
  trackEffectDeps(effect, handle)
  if (hasLinkedSignal(handle)) {
    const stop = () => clearEffectLinks(handle)
    stop.pause = () => {
      isActivated = false
    }
    stop.resume = () => {
      isActivated = true
      if (dirty) {
        dirty = false
        handle()
      }
    }
    return stop
  }
  return null
}
