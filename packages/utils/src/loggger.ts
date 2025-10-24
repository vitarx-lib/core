export type LogSource = {
  /** 源文件名 */
  fileName: string
  /** 源代码行号 */
  lineNumber: number
  /** 源代码列号 */
  columnNumber: number
}
/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}
/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /** 当前日志级别 */
  level: LogLevel
  /** 是否启用源代码位置信息 */
  includeSourceInfo: boolean
  /** 自定义前缀 */
  prefix?: string
}

/**
 * 默认日志配置
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: import.meta.env?.DEV ? LogLevel.DEBUG : LogLevel.WARN,
  includeSourceInfo: import.meta.env?.DEV,
  prefix: ''
}

/**
 * Vitarx 日志助手
 *
 * 提供统一的日志接口，支持不同级别的日志输出，
 * 并可在开发模式下显示源代码位置信息。
 *
 * @example
 * ```ts
 * // 基本使用
 * logger.warn('这是一个警告消息');
 *
 * // 带源代码位置信息
 * logger.error('发生错误',
 *   { fileName: 'App.vue', lineNumber: 42, columnNumber: 15 }
 * );
 *
 * // 设置全局日志级别
 * logger.setConfig({ level: LogLevel.ERROR });
 * ```
 */
export class Logger {
  private config: LoggerConfig = { ...DEFAULT_CONFIG }

  /**
   * 设置日志配置
   *
   * @param config 新的日志配置，会与现有配置合并
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取当前日志配置
   *
   * @returns 当前日志配置
   */
  getConfig(): LoggerConfig {
    return { ...this.config }
  }

  /**
   * 输出调试日志
   *
   * @param message 日志消息
   * @param args 附加数据或源代码位置信息
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args)
  }

  /**
   * 输出信息日志
   *
   * @param message 日志消息
   * @param args 附加数据或源代码位置信息
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args)
  }

  /**
   * 输出警告日志
   *
   * @param message 日志消息
   * @param args 附加数据或源代码位置信息
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args)
  }

  /**
   * 输出错误日志
   *
   * @param message 日志消息
   * @param args 附加数据或源代码位置信息
   */
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args)
  }

  /**
   * 内部日志处理方法
   *
   * @param level 日志级别
   * @param message 日志消息
   * @param args 附加数据或源代码位置信息
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    // 检查日志级别
    if (level < this.config.level) {
      return
    }

    // 解析参数
    let data: any[]
    let source: LogSource | undefined

    // 检查最后一个参数是否是源代码位置信息
    const lastArg = args[args.length - 1]
    if (
      args.length > 0 &&
      lastArg &&
      typeof lastArg === 'object' &&
      'fileName' in lastArg &&
      'lineNumber' in lastArg &&
      'columnNumber' in lastArg
    ) {
      source = lastArg as LogSource
      data = args.slice(0, -1)
    } else {
      data = args
    }

    // 处理空数据
    if (data.length === 1 && data[0] === undefined) data = []
    // 格式化消息
    const formattedMessage = this.formatMessage(level, message, source)

    // 输出日志
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, ...data)
        break
      case LogLevel.INFO:
        console.info(formattedMessage, ...data)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage, ...data)
        break
      case LogLevel.ERROR:
        console.error(formattedMessage, ...data)
        break
    }
  }

  /**
   * 格式化日志消息
   *
   * @param level 日志级别
   * @param message 原始消息
   * @param source 源代码位置信息
   * @returns 格式化后的消息
   */
  public formatMessage(level: LogLevel, message: string, source?: LogSource): string {
    let prefix = ''

    // 添加自定义前缀
    if (this.config.prefix) {
      prefix += this.config.prefix
    }
    // 添加日志级别标识
    switch (level) {
      case LogLevel.DEBUG:
        prefix += '[DEBUG]'
        break
      case LogLevel.INFO:
        prefix += '[INFO]'
        break
      case LogLevel.WARN:
        prefix += '[WARN]'
        break
      case LogLevel.ERROR:
        prefix += '[ERROR]'
        break
    }

    // 添加源代码位置信息
    if (source && this.config.includeSourceInfo) {
      const { fileName, lineNumber, columnNumber } = source
      const shortFileName = fileName.split('/').pop() || fileName
      return `${prefix}${message} (${shortFileName}:${lineNumber}:${columnNumber})`
    }

    return `${prefix}: ${message}`
  }
}
