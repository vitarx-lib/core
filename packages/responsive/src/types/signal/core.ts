import { DEP_LINK_HEAD, DEP_LINK_TAIL, DepLink } from '../../depend/index.js'
import { IS_SIGNAL, SIGNAL_VALUE } from '../../signal/index.js'

/**
 * 响应式信号接口
 *
 * @template T - 信号包装值类型
 * @interface
 */
export interface Signal<T = any> {
  /** 是否为 signal（类型判定用） */
  readonly [IS_SIGNAL]: true
  /** 读取值（必须提供，readSignal / getSignal 使用） */
  readonly [SIGNAL_VALUE]: T
  /**
   * signal → watcher 链表头
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [DEP_LINK_HEAD]?: DepLink
  /**
   * signal → watcher 链表尾
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [DEP_LINK_TAIL]?: DepLink
}
/**
 * 获取信号值类型辅助工具
 */
export type UnwrapSignal<T> = T extends Signal<infer V> ? V : T
