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
  /**
   * 要输出的信息
   *
   * 支持 ${prop} 占位符
   *
   * @default "The object is read-only, and the ${prop} attribute cannot be removed!"
   */
  message?: string
}
