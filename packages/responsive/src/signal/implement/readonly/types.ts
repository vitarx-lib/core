export type WriteHandleMode = 'error' | 'warning' | 'warningAndWrite'

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
  write?: WriteHandleMode
}
