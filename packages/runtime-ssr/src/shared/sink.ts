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

  /**
   * 清空缓冲区
   */
  clear(): void {
    this.buffer = []
  }
}

/**
 * 流式接收器
 * 用于流式渲染的输出
 */
export class StreamSink implements Sink {
  private controller: ReadableStreamDefaultController<string> | null = null
  private encoder = new TextEncoder()

  constructor(controller: ReadableStreamDefaultController<string>) {
    this.controller = controller
  }

  /**
   * 将内容推送到流
   * @param content - 要推送的内容
   */
  push(content: string): void {
    if (this.controller) {
      this.controller.enqueue(content)
    }
  }

  /**
   * 关闭流
   */
  close(): void {
    if (this.controller) {
      this.controller.close()
      this.controller = null
    }
  }

  /**
   * 发送错误到流
   * @param error - 错误对象
   */
  error(error: Error): void {
    if (this.controller) {
      this.controller.error(error)
      this.controller = null
    }
  }
}
