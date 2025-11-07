import { Ref } from '@vitarx/responsive'
import { inject } from './provide.js'

/**
 * `Suspense` 计数器标识符
 *
 * 用于在组件树中跟踪当前组件的挂起状态。
 */
export const SUSPENSE_COUNTER_SYMBOL = Symbol('SUSPENSE_COUNTER_SYMBOL')
/**
 * 获取上级 `Suspense` 计数器
 *
 * @returns {Ref<number> | undefined} 如果存在则返回计数器Ref，不存在则返回undefined
 */
export function useSuspense(): Ref<number> | undefined {
  return inject<Ref<number> | undefined>(SUSPENSE_COUNTER_SYMBOL, undefined)
}
