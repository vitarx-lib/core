import { DEP_LINK_HEAD, DEP_LINK_TAIL, DepLink } from '../depend/index.js'
import { IS_SIGNAL, SIGNAL_RAW_VALUE, SIGNAL_READ_VALUE } from '../signal/index.js'

/**
 * 响应式信号接口
 *
 * @template RAW - 原始值类型
 * @template VALUE - 读取值类型
 * @interface
 */
export interface Signal<RAW = any, VALUE = RAW> {
  /** 是否为 signal（类型判定用） */
  readonly [IS_SIGNAL]: true
  /** 原始值（getter，可选提供，toRaw 使用，读取且不触发跟踪） */
  readonly [SIGNAL_RAW_VALUE]?: RAW
  /** 读取值（getter，必须提供，readSignal 使用，读取正常触发跟踪） */
  readonly [SIGNAL_READ_VALUE]: VALUE
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

export type CompareFunction = (oldValue: any, newValue: any) => boolean

/**
 * 信号可选配置选项
 */
export type SignalOptions = {
  /**
   * 对比函数
   *
   * 如果不设置，则使用默认的 `Object.is`
   *
   * @default Object.is
   */
  compare?: CompareFunction
}
