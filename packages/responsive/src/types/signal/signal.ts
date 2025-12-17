import {
  SIGNAL_DEP_HEAD,
  SIGNAL_DEP_TAIL,
  SIGNAL_SYMBOL,
  type SIGNAL_VALUE
} from '../../constants/index.js'
import type { DepLink } from '../../depend/index.js'

/**
 * 响应式信号接口
 *
 * @template T - 信号包装值类型
 * @interface
 */
export interface Signal<T = any> {
  /** 是否为 signal（类型判定用） */
  readonly [SIGNAL_SYMBOL]: true
  /** 读取值（必须提供，readSignal / getSignal 使用） */
  readonly [SIGNAL_VALUE]: T
  /**
   * signal → effect 链表头
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [SIGNAL_DEP_HEAD]?: DepLink
  /**
   * signal → effect 链表尾
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [SIGNAL_DEP_TAIL]?: DepLink
}

/**
 * 获取信号值类型辅助工具
 */
export type UnwrapSignal<T> = T extends Signal<infer V> ? V : T
