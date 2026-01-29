import { clearEffectLinks, hasLinkedSignal, queueJob, trackEffect } from '@vitarx/responsive'

export type ViewEffect = {
  stop: () => void
  pause: () => void
  resume: () => void
}

/**
 * 用于执行一个视图副作用函数，
 * 主要服务于视图运行时，如视图更新调度，业务层副作用谨慎使用！
 *
 * @warning - ⚠️ 需在合适的时机主动停止副作用，否则可能会造成内存泄露。
 * @internal - 仅限视图运行时使用
 * @param effect - 要执行的副作用函数
 * @returns { ViewEffect | null } 副作用存在信号依赖则返回视图副作用控制对象，否则返回 NULL
 */
export function viewEffect(effect: () => void): ViewEffect | null {
  let isActivated: boolean = true
  let dirty: boolean = false
  const runner = () => {
    isActivated ? queueJob(runEffect) : (dirty = true)
  }
  const runEffect = () => {
    isActivated ? (dirty = true) : trackEffect(effect, runner)
  }
  runEffect()
  if (hasLinkedSignal(runner)) {
    return {
      pause(): void {
        isActivated = false
      },
      resume(): void {
        if (!isActivated) {
          isActivated = true
          if (dirty) {
            dirty = false
            runner()
          }
        }
      },
      stop(): void {
        isActivated = false
        clearEffectLinks(runner)
      }
    }
  }
  return null
}
