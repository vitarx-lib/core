import { AnyObject } from '@vitarx/utils'
import { PROXY_SIGNAL_SYMBOL } from '../constants'
import type { BaseSignal } from './base'

/**
 * 响应式代理信号
 *
 * @template Target - 原始目标对象类型
 * @template Proxy - 代理对象类型
 * @template Deep - 是否为深度代理
 */
export type ProxySignal<
  Target extends AnyObject = AnyObject,
  Proxy extends AnyObject = Target,
  Deep extends boolean = boolean
> = BaseSignal<Target, Deep> & {
  readonly [PROXY_SIGNAL_SYMBOL]: true
} & Proxy
