/**
 * 自定义日志处理器
 *
 * @param level - 日志级别
 * @param message - 日志消息
 * @param tag - 日志标签
 */
export type CustomLoggerHandler = (level: string, message: string, tag: string) => void | false

/**
 * 日志处理程序
 *
 * 框架内部的所有日志都是使用此日志处理程序进行输出。
 * 可以通过调用`Logger.setCustomHandler`方法设置自定义日志处理程序，
 * 并根据需要自定义日志输出方式，以及上传到服务器等操作。
 */
export class Logger {
  private customHandler: CustomLoggerHandler | null = null
  private readonly tag: string

  /**
   * 构造函数
   *
   * @param tag - 日志标签
   */
  constructor(tag: string) {
    this.tag = tag
  }

  /**
   * 设置自定义日志处理程序
   *
   * @param handler - 自定义日志处理程序，返回false可以阻止日志输出到控制台
   */
  public setCustomHandler(handler: CustomLoggerHandler): void {
    this.customHandler = handler
  }

  /**
   * 输出信息级别的日志
   *
   * @param message - 日志消息
   * @param tag - 日志标签，可选参数
   */
  public info(message: string, tag?: string): void {
    this.log('info', message, tag)
  }

  /**
   * 输出警告级别的日志
   *
   * @param message - 日志消息
   * @param tag - 日志标签，可选参数
   */
  public warn(message: string, tag?: string): void {
    this.log('warn', message, tag)
  }

  /**
   * 输出错误级别的日志
   *
   * @param message - 日志消息，可以是字符串或Error对象
   * @param tag - 日志标签，可选参数
   */
  public error(message: string | unknown, tag?: string): void {
    if (message instanceof Error) {
      this.log('error', `${message}\nStack trace:\n${message.stack}`, tag)
    } else {
      this.log('error', String(message), tag)
    }
  }

  /**
   * 输出调试级别的日志
   *
   * @param message - 日志消息
   * @param tag - 日志标签，可选参数
   */
  public debug(message: string, tag?: string): void {
    this.log('debug', message, tag)
  }

  /**
   * 日志输出
   *
   * @param level - 日志级别
   * @param message - 日志消息
   * @param tag - 日志标签，可选参数
   */
  public log(level: string, message: string, tag?: string): void {
    const logTag = tag ?? this.tag
    const logMessage = `[${logTag}][${level.toUpperCase()}]: ${message}`
    if (this.customHandler) {
      const shouldLog = this.customHandler(level, message, logTag)
      if (shouldLog === false) return
    }
    switch (level) {
      case 'info':
        console.info(logMessage)
        break
      case 'warn':
        console.warn(logMessage)
        break
      case 'error':
        console.error(logMessage)
        break
      case 'debug':
        console.debug(logMessage)
        break
      default:
        console.log(logMessage)
    }
  }
}
