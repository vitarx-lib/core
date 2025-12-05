/**
 * 输出接收器接口
 * 用于统一字符串渲染和流式渲染的输出
 */
export interface Sink {
  /**
   * 将内容推送到输出
   * @param content - 要推送的内容
   */
  push(content: string): void
}

/**
 * 字符串接收器
 * 管理同步渲染的字符串输出缓冲区
 */
export class StringSink implements Sink {
  private buffer: string[] = []

  /**
   * 获取当前缓冲区大小
   * @returns 缓冲区中的块数量
   */
  get size(): number {
    return this.buffer.length
  }

  /**
   * 将内容推送到缓冲区
   * @param content - 要推送的内容
   */
  push(content: string): void {
    this.buffer.push(content)
  }

  /**
   * 获取完整的 HTML 字符串
   * @returns 完整的 HTML 字符串
   */
  toString(): string {
    return this.buffer.join('')
  }
}
