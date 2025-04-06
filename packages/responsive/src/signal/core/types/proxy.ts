import { PROXY_SIGNAL_SYMBOL } from '../constants'
import type { BaseSignal } from './base'

/**
 * 响应式代理信号
 */
export type ProxySignal<
  Target extends AnyObject = AnyObject,
  Proxy extends AnyObject = Target,
  Deep extends boolean = boolean
> = BaseSignal<Target, Deep> & {
  readonly [PROXY_SIGNAL_SYMBOL]: true
} & Proxy
