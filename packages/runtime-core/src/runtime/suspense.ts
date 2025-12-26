import { ValueRef } from '@vitarx/responsive'
import { SUSPENSE_COUNTER } from '../constants/index.js'
import { inject } from './provide.js'

/**
 * 获取上级 `Suspense` 计数器
 *
 * @returns {ValueRef<number> | undefined} 如果存在则返回计数器Ref，不存在则返回undefined
 */
export function useSuspense(): ValueRef<number> | undefined {
  return inject<ValueRef<number> | undefined>(SUSPENSE_COUNTER, undefined)
}
