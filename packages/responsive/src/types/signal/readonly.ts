import type { DeepReadonly } from '@vitarx/utils'
import type { DeepUnwrapNestedSignal, UnwrapNestedSignal } from './signal.js'

export type ReadonlyProxy<T extends object, Deep extends boolean> = Deep extends true
  ? DeepReadonly<DeepUnwrapNestedSignal<T>>
  : Readonly<UnwrapNestedSignal<T>>

/**
 * 只读选项接口
 */
export interface ReadonlyOptions<Deep extends boolean = boolean> {
  /**
   * 是否深度只读
   * @default true
   */
  deep?: Deep
  /**
   * 写入行为处理模式
   * - error: 抛出错误
   * - warning: 仅警告
   * - warningAndWrite: 警告并允许写入
   *
   * @default "error"
   */
  write?: 'error' | 'warning' | 'warningAndWrite'
  /**
   * 要输出的信息
   *
   * 支持 ${prop} 占位符
   *
   * @default "The object is read-only, and the ${prop} attribute cannot be removed!"
   */
  message?: string
}
