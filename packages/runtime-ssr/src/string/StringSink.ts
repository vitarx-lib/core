/**
 * SSR 渲染的字符串接收器
 * 管理同步渲染的字符串输出缓冲区
 */
export class StringSink {
  private buffer: string[] = []

  /**
   * 将内容推送到缓冲区
   * 
   * @param content - 要推送的内容
   */
  push(content: string): void {
    this.buffer.push(content)
  }

  /**
   * 获取完整的 HTML 字符串
   * 
   * @returns 完整的 HTML 字符串
   */
  toString(): string {
    return this.buffer.join('')
  }

  /**
   * 清空缓冲区
   */
  clear(): void {
    this.buffer = []
  }

  /**
   * 获取当前缓冲区大小
   * 
   * @returns 缓冲区中的块数量
   */
  get size(): number {
    return this.buffer.length
  }
}
