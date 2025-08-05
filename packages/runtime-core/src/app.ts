export class App {
  /**
   * 是否运行在服务端
   */
  static isServer =
    typeof process !== 'undefined' && process.versions != null && process.versions.node != null
  /**
   * 是否为运行在客户端
   */
  static isClient = !App.isServer
}
