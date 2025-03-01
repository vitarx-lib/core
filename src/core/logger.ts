export default class Logger {
  static warn(...args: string[]) {
    const stack = new Error().stack // 获取当前堆栈
    console.warn(`[Vitarx][WARN]：${args.join('\n')}\nStack trace:\n${stack}`)
  }

  static info(...args: string[]) {
    console.info(`[Vitarx][INFO]：${args.join('\n')}`)
  }

  static error(...args: any[]) {
    if (args.length === 1 && args[0] instanceof Error) {
      return console.error(args[0])
    }
    const stack = new Error().stack // 获取当前堆栈
    console.error(`[Vitarx][ERROR]：${args.join('\n')}\nStack trace:\n${stack}`)
  }

  static debug(...args: string[]) {
    const stack = new Error().stack // 获取当前堆栈
    console.debug(`[Vitarx][DEBUG]：${args.join('\n')}\nStack trace:\n${stack}`)
  }
}
