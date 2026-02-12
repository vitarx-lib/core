export type CodeSource = {
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
  DEBUG = 'Debug',
  INFO = 'Info',
  WARN = 'Warn',
  ERROR = 'Error'
}
/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /** 当前日志级别 */
  level: LogLevel
  /** 是否启用源代码位置信息 */
  includeSourceInfo: boolean
  /**
   * 自定义日志处理函数
   *
   * @param level - 日志级别
   * @param message - 日志消息
   * @param args - 其他参数
   */
  handler?: (level: LogLevel, message: string, args: any[], source: CodeSource | undefined) => void
  /** 自定义前缀 */
  prefix?: string
}

/**
 * 默认日志配置
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: __DEV__ ? LogLevel.DEBUG : LogLevel.ERROR,
  includeSourceInfo: __DEV__,
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
   * 构造函数，用于创建Logger实例
   * @param [config] 可选的Logger配置对象，可以是Partial<LoggerConfig>类型
   * 如果提供了config参数，则调用setConfig方法应用配置
   */
  constructor(config?: Partial<LoggerConfig>) {
    if (config) this.setConfig(config) // 如果存在config参数，则调用setConfig方法设置配置
  }
  /**
   * 设置日志配置
   *
   * @param config 新的日志配置，会与现有配置合并
   * @returns {this} 当前实例
   */
  setConfig(config: Partial<LoggerConfig>): this {
    this.config = { ...this.config, ...config }
    return this
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
   * 格式化日志消息
   *
   * @param level 日志级别
   * @param message 原始消息
   * @param source 源代码位置信息
   * @returns 格式化后的消息
   */
  public formatMessage(level: LogLevel, message: string, source?: CodeSource): string {
    let prefix = this.config.prefix ? `[${this.config.prefix} ${level}]` : `[${level}]`
    // 如果message开头没有空格，则添加一个空格
    const formattedMessage =
      message.startsWith(' ') || message.startsWith('[') ? message : ` ${message}`
    // 添加源代码位置信息
    if (source && this.config.includeSourceInfo) {
      const { fileName, lineNumber, columnNumber } = source
      const shortFileName = fileName.split('/').pop() || fileName
      return `${prefix}${formattedMessage}\n    at (${shortFileName}:${lineNumber}:${columnNumber})`
    }
    return prefix + formattedMessage
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
    let source: CodeSource | undefined

    // 检查最后一个参数是否是源代码位置信息
    const lastArg = args.at(-1)
    if (
      args.length > 0 &&
      lastArg &&
      typeof lastArg === 'object' &&
      'fileName' in lastArg &&
      'lineNumber' in lastArg &&
      'columnNumber' in lastArg
    ) {
      source = lastArg as CodeSource
      data = args.slice(0, -1)
    } else {
      data = args
    }

    // 处理空数据
    if (data.length === 1 && data[0] === undefined) data = []
    if (this.config.handler) {
      this.config.handler(level, message, data, source)
    }
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
}

/**
 * vitarx框架共享的日志助手实例
 */
export const logger = new Logger({ prefix: 'Vitarx' })

/**
 * 获取当前调用栈的字符串表示
 *
 * @example
 * ```ts
 * console.log(getStackTrace())
 * // 输出结果：
 * // at getStackTrace (file:///path/to/your/file.js:123:45)
 * ```
 *
 * @param skip - 要跳过的堆栈帧数量，默认为1，跳过当前方法本身
 * @returns {string} 返回格式化后的调用栈字符串，如果无法获取则返回空字符串
 */
export function getStackTrace(skip: number = 1): string {
  // 创建一个Error对象以获取调用栈信息
  const err = new Error()
  // 获取Error对象的堆栈轨迹
  const stack = err.stack
  // 如果没有堆栈信息，直接返回空字符串
  if (!stack) return ''
  // 将堆栈轨迹按换行符分割成多行
  const lines = stack.split('\n')
  // lines[0] 通常是 "Error"
  // 从 skip + 1 开始裁剪，跳过指定数量的堆栈帧
  return '\n' + lines.slice(skip + 1).join('\n')
}

/**
 * 获取调用源文件信息
 * 通过创建错误对象并解析其堆栈信息，获取调用者的文件名、行号和列号
 * @returns {CodeSource} 返回包含文件名、行号和列号的对象
 */
export function getCallSource(): CodeSource {
  // 创建一个错误对象以获取堆栈信息
  const err = new Error()

  // 如果错误对象没有堆栈信息，返回默认值
  if (!err.stack) {
    return {
      fileName: 'unknown',
      lineNumber: 0,
      columnNumber: 0
    }
  }

  // 将堆栈信息按行分割
  const stack = err.stack.split('\n')

  // stack 示例：
  // 0 Error
  // 1 at getCallSource (...)
  // 2 at b (...)
  // 3 at a (...)   <-- 我们想要这一层
  // 获取目标调用行，优先选择第4行(索引3)，其次选择第3行(索引2)
  const targetLine = stack[3] || stack[2] || ''

  // Chrome / Node / V8 格式匹配
  // 匹配两种格式的堆栈信息：带括号和不带括号的格式
  const match = targetLine.match(/\((.*):(\d+):(\d+)\)/) || targetLine.match(/at (.*):(\d+):(\d+)/)

  // 如果没有匹配到，返回默认值
  if (!match) {
    return {
      fileName: 'unknown',
      lineNumber: 0,
      columnNumber: 0
    }
  }

  // 返回解析后的文件名、行号和列号
  return {
    fileName: match[1],
    lineNumber: Number(match[2]),
    columnNumber: Number(match[3])
  }
}
