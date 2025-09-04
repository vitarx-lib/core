import type { ErrorHandler } from '@vitarx/runtime-core'
import {
  createVNode,
  type ErrorInfo,
  VNode,
  type WidgetType,
  WidgetVNode
} from '@vitarx/runtime-core'

/** 应用配置 */
export interface AppConfig {
  /**
   * 错误处理函数
   *
   * @param error - 捕获到的异常
   * @param info - 具体的错误信息
   * @default (error, info) => {
   *   console.error(error,info)
   * }
   */
  errorHandler?: ErrorHandler
}

type OptionallyConfigurablePlugIns<T extends {}> = (app: App, options?: T) => void
type NoConfigurationPlugins = (app: App) => void
type RequiredConfigurationPlugIn<T extends {}> = (app: App, options: T) => void
/**
 * 插件安装
 *
 * @template T - 插件配置选项
 * @param {App} app - App应用实例
 * @param {T} options - 插件配置选项
 * @returns {void}
 */
export type AppPluginInstall<T extends {} = {}> =
  | OptionallyConfigurablePlugIns<T>
  | NoConfigurationPlugins
  | RequiredConfigurationPlugIn<T>

/**
 * ## 插件对象
 *
 * 必须提供一个install方法，用于安装插件。
 *
 * @template T - 插件配置选项
 */
export interface AppObjectPlugin<T extends {} = {}> {
  /**
   * 安装插件
   */
  install: AppPluginInstall<T>
}

/**
 * ## 插件
 *
 * 插件是一个函数，或者一个对象，它具有一个install方法，用于安装插件。
 *
 * @template T - 插件配置选项
 */
export type AppPlugin<T extends {} = {}> = AppObjectPlugin<T> | AppPluginInstall<T>

/**
 * ## Vitarx App
 *
 * 用于创建和运行 Vitarx 应用。
 */
export class App {
  /** 配置选项 */
  public readonly config: Required<AppConfig>
  /**
   * 根节点
   * @private
   */
  readonly #node: WidgetVNode
  /**
   * 提供数据
   * @private
   */
  readonly #provide: Map<string | symbol, any> = new Map()

  /**
   * 构建应用实例
   *
   * @param node - 根节点/小部件
   * @param config - 配置选项
   */
  constructor(node: VNode | WidgetType, config?: AppConfig) {
    if (typeof node === 'function') {
      this.#node = createVNode(node) as WidgetVNode
    } else if (WidgetVNode.is(node)) {
      this.#node = node
    } else {
      throw new Error('The root node must be a widget')
    }
    // 使用展开运算符合并配置，提供默认错误处理
    this.config = {
      errorHandler: (error: unknown, info: ErrorInfo) => console.error(error, info),
      ...config
    } as Required<AppConfig>
    this.#node.provide('App', this)
  }

  /**
   * 获取当前组件的虚拟DOM节点(VNode)
   * @returns {WidgetVNode} 返回当前组件的虚拟DOM节点实例
   */
  get node(): WidgetVNode {
    return this.#node
  }
  /**
   * 获取版本号
   *
   * @returns {string} - 版本号
   */
  get version(): string {
    // @ts-ignore
    return __VERSION__
  }

  /**
   * 将组件挂载到指定的DOM容器中
   *
   * @param container 可以是DOM元素节点或选择器字符串
   * @returns {this} 返回当前App实例，支持链式调用
   * @example
   * const app = createApp(YourAppHomeWidget)
   * app.mount('#app') // 挂载到id为#app的元素
   */
  mount(container: ParentNode | string): this {
    // 如果传入的是字符串，则通过querySelector获取对应的DOM元素
    if (typeof container === 'string') {
      container = document.querySelector(container)!
      // 如果找不到对应的DOM元素，抛出错误
      if (!container) {
        throw new Error(
          `[Vitarx.createApp][ERROR]: The element corresponding to the specified selector ${container} was not found.`
        )
      }
    }
    // 调用组件的mount方法，将组件挂载到指定的容器中
    this.#node.mount(container)
    // 返回当前组件实例，支持链式调用
    return this
  }

  /**
   * 卸载应用的方法
   * 该方法用于执行组件的卸载操作，清理相关资源
   */
  unmount(): void {
    this.#node.unmount() // 调用内部节点的卸载方法
  }

  /**
   * 应用级数据提供
   *
   * @param {string | symbol} name - 注入名称
   * @param {any} value - 注入值
   */
  provide(name: string | symbol, value: any): this {
    this.#provide.set(name, value)
    return this
  }

  /**
   * 获取提供值的方法
   * @template T - 提供值的类型
   * @param name - 要获取的提供值的名称，可以是字符串或symbol类型
   * @param defaultValue - 可选参数，当指定名称的提供值不存在时返回的默认值
   * @returns {T} 返回获取到的提供值，如果不存在则返回默认值
   */
  getProvide<T = any>(name: string | symbol, defaultValue?: T): T {
    return this.#provide.get(name) ?? defaultValue
  }

  /**
   * ## 安装插件
   *
   * @param {Function|Object} plugin - 无配置选项的插件
   * @returns {this} - 返回应用实例本身，支持链式调用
   */
  use(plugin: NoConfigurationPlugins | { install: NoConfigurationPlugins }): this
  /**
   * ## 安装插件
   *
   * @template T - 插件选项类型
   * @param {Function|Object} plugin - 有必填选项的插件
   * @param {T} options - 插件选项
   * @returns {this} - 返回应用实例本身，支持链式调用
   */
  use<T extends {}>(
    plugin: RequiredConfigurationPlugIn<T> | { install: RequiredConfigurationPlugIn<T> },
    options: T
  ): this
  /**
   * ## 安装插件
   *
   * @template T - 插件选项类型
   * @param {Function|Object} plugin - 有可选选项的插件
   * @param {Object} options - 插件选项
   * @returns {this} - 返回应用实例本身，支持链式调用
   */
  use<T extends {}>(
    plugin: OptionallyConfigurablePlugIns<T> | { install: OptionallyConfigurablePlugIns<T> },
    options?: T
  ): this
  /**
   * ## 安装插件
   *
   * @template T - 插件选项类型
   * @param {AppPlugin<T>} plugin - 可选选项的插件函数
   * @param {T} options - 插件选项
   * @returns {this} - 返回应用实例本身，支持链式调用
   */
  use<T extends {}>(plugin: AppPlugin<T>, options?: T): this {
    const pluginType = typeof plugin
    if (!pluginType) return this
    let install: AppPluginInstall<T>
    if (pluginType === 'object') {
      install = (plugin as AppObjectPlugin<T>).install
    } else {
      install = plugin as AppPluginInstall<T>
    }
    if (typeof install !== 'function') {
      throw new Error(
        `[Vitarx.App.use][ERROR]: The plugin must be a function or an object with an install method.`
      )
    }
    install(this, options!)
    return this
  }
}

// 提供别名，方便使用，避免和App入口组件命名冲突
export { App as Vitarx }

/**
 * ## 创建一个应用实例
 *
 * @param node - 根节点
 * @param config - 应用配置
 * @returns {Vitarx} - 应用实例
 */
export function createApp(node: VNode | WidgetType, config?: AppConfig): App {
  return new App(node, config)
}
