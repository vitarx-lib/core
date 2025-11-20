import { Ref } from '@vitarx/responsive'
import { SUSPENSE_COUNTER_SYMBOL } from '../constants/index.js'
import { inject } from './provide.js'

/**
 * 获取上级 `Suspense` 计数器
 *
 * @returns {Ref<number> | undefined} 如果存在则返回计数器Ref，不存在则返回undefined
 */
export function useSuspense(): Ref<number> | undefined {
  return inject<Ref<number> | undefined>(SUSPENSE_COUNTER_SYMBOL, undefined)
}
