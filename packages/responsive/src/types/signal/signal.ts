import {
  IS_SIGNAL,
  type SIGNAL_CURRENT,
  SIGNAL_DEP_HEAD,
  SIGNAL_DEP_TAIL,
  SIGNAL_PEEK
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
  readonly [IS_SIGNAL]: true
  /** 读写统一路径（正常读写行为，应触发对应信号） */
  [SIGNAL_CURRENT]: T
  /** 静默读取路径，不发出信号，只读取值 */
  readonly [SIGNAL_PEEK]: T
  /**
   * signal → effect 链表头
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   *
   * @internal
   */
  [SIGNAL_DEP_HEAD]?: DepLink
  /**
   * signal → effect 链表尾
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   *
   * @internal
   */
  [SIGNAL_DEP_TAIL]?: DepLink
}

/**
 * 获取信号值类型辅助工具
 */
export type UnwrapSignal<T> = T extends Signal<infer V> ? V : T
