import { getActiveScope } from './scope.js'

/**
 * 在作用域销毁时执行回调函数的通用函数
 *
 * @param fn - 要执行的回调函数
 * @param failSilently - 是否静默失败（不输出警告）
 * @param action - 执行的动作名称
 */
function onScopeAction(
  fn: () => void,
  failSilently: boolean | undefined,
  action: 'Dispose' | 'Pause' | 'Resume'
): void {
  const scope = getActiveScope()
  if (scope) {
    scope[`on${action}`](fn)
  } else if (!failSilently) {
    console.warn(`[Vitarx.EffectScope] onScope${action}() no active scope found`)
  }
}

/**
 * 在作用域销毁时注册回调函数
 *
 * @param fn - 作用域销毁时要执行的回调函数
 * @param failSilently - 是否静默失败（不输出警告），默认为 false
 */
export function onScopeDispose(fn: () => void, failSilently?: boolean): void {
  onScopeAction(fn, failSilently, 'Dispose')
}

/**
 * 在作用域暂停时注册回调函数
 *
 * @param fn - 作用域暂停时要执行的回调函数
 * @param failSilently - 是否静默失败（不输出警告），默认为 false
 */
export function onScopePause(fn: () => void, failSilently?: boolean): void {
  onScopeAction(fn, failSilently, 'Pause')
}

/**
 * 在作用域恢复时注册回调函数
 *
 * @param fn - 作用域恢复时要执行的回调函数
 * @param failSilently - 是否静默失败（不输出警告），默认为 false
 */
export function onScopeResume(fn: () => void, failSilently?: boolean): void {
  onScopeAction(fn, failSilently, 'Resume')
}
