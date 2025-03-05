import { type CustomLoggerHandler, Logger } from '../utils/index.js'

/**
 * 核心日志输出
 *
 * 用户可以通过设置自定义日志处理程序来覆盖默认的日志输出方式，以及上传到服务器。
 *
 * @example
 * ```ts
 * import { CoreLogger } from 'vitarx'
 *
 * CoreLogger.setCustomHandler((level: string, message: string, tag: string) => {
 *   console.log(`[${tag}]: ${message}`)
 *   return false
 * })
 * ```
 */
export default class CoreLogger {
  static #logger = new Logger('Vitarx')

  /**
   * 输出核心警告日志
   *
   * @param tag - 日志标签
   * @param message
   */
  static warn(tag: string, message: string) {
    this.#logger.warn(message, `Vitarx.${tag}`)
  }

  /**
   * 输出核心普通日志
   *
   * @param tag
   * @param message
   */
  static info(tag: string, message: string) {
    this.#logger.info(message, `Vitarx.${tag}`)
  }

  /**
   * 输出核心错误日志
   *
   * @param tag
   * @param message
   * @param error
   */
  static error(tag: string, message: unknown, error?: unknown) {
    if (error instanceof Error) {
      error.message = `${message} - ${error.message}`
      this.#logger.error(error, `Vitarx.${tag}`)
    } else {
      this.#logger.error(message, `Vitarx.${tag}`)
    }
  }

  /**
   * 输出核心调试日志
   *
   * @param tag
   * @param message
   */
  static debug(tag: string, message: string) {
    this.#logger.debug(message, `Vitarx.${tag}`)
  }

  /**
   * 设置自定义日志处理器
   *
   * @param handler
   */
  static setCustomHandler(handler: CustomLoggerHandler) {
    this.#logger.setCustomHandler(handler)
  }
}
