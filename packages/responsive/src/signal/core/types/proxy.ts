import { DEEP_SIGNAL_SYMBOL, GET_RAW_TARGET_SYMBOL, PROXY_SIGNAL_SYMBOL } from '../constants'
import type { BaseSignal } from './base'

/**
 * 响应式代理信号
 */
export type ProxySignal<
  Target extends AnyObject = AnyObject,
  Proxy extends AnyObject = Target,
  Deep extends boolean = boolean
> = BaseSignal & {
  readonly [DEEP_SIGNAL_SYMBOL]: Deep
  readonly [PROXY_SIGNAL_SYMBOL]: true
  readonly [GET_RAW_TARGET_SYMBOL]: Target
} & Proxy
