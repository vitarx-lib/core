export default class Logger {
  static warn(...args: any[]) {
    const error = args.find(arg => arg instanceof Error) ?? new Error()
    console.warn(`[Vitarx][WARN]：${args.join('\n')}\nStack trace:\n${error.stack}`)
  }

  static info(...args: string[]) {
    console.info(`[Vitarx][INFO]：${args.join('\n')}`)
  }

  static error(...args: any[]) {
    const error = args.find(arg => arg instanceof Error) ?? new Error()
    console.error(`[Vitarx][ERROR]：${args.join('\n')}\nStack trace:\n${error.stack}`)
  }

  static debug(...args: any[]) {
    const error = args.find(arg => arg instanceof Error) ?? new Error()
    console.debug(`[Vitarx][DEBUG]：${args.join('\n')}\nStack trace:\n${error.stack}`)
  }
}
