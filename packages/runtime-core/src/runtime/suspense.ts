import { ShallowRef } from '@vitarx/responsive'
import { SUSPENSE_COUNTER } from '../shared/constants/symbol.js'
import { inject } from './provide.js'

/**
 * 获取上级 `Suspense` 计数器
 *
 * @returns {ShallowRef<number> | undefined} 如果存在则返回计数器Ref，不存在则返回undefined
 */
export function useSuspense(): ShallowRef<number> | undefined {
  return inject<ShallowRef<number> | undefined>(SUSPENSE_COUNTER, undefined)
}
