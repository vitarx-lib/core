import { NON_SIGNAL_SYMBOL } from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import { runInAppContext } from '../runtime/index.js'
import type { ErrorInfo, WidgetType } from '../types/index.js'
import { isStatefulWidgetNode } from '../utils/index.js'
import { createVNode, StatefulWidgetNode } from '../vnode/index.js'

/** 应用配置 */
export type AppConfig = Vitarx.AppConfig

type OptionallyConfigurablePlugIns<T extends {}> = (app: App, options?: T) => void
type NonConfigurationPlugins = (app: App) => void
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
  | NonConfigurationPlugins
  | RequiredConfigurationPlugIn<T>

/**
 * 插件对象
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
 * 插件
 *
 * 插件是一个函数，或者一个对象，它具有一个install方法，用于安装插件。
 *
 * @template T - 插件配置选项
 */
export type AppPlugin<T extends {} = {}> = AppObjectPlugin<T> | AppPluginInstall<T>
/**
 * 默认错误处理函数
 *
 * @param error
 * @param info
 */
const defaultErrorHandler = (error: unknown, info: ErrorInfo) =>
  logger.error('there are unhandled exceptions', error, info)
/**
 * Vitarx App 基类
 */
export abstract class App {
  readonly [NON_SIGNAL_SYMBOL] = true
  /** 配置选项 */
  public readonly config: Required<AppConfig>
  /**
   * 根节点
   * @private
   */
  readonly #rootNode: StatefulWidgetNode
  /**
   * 提供数据
   * @private
   */
  readonly #provide: Map<string | symbol, any> = new Map()
  /**
   * 是否为服务端渲染
   *
   * 如果设置为true，会禁用组件依赖跟踪。
   *
   * @default false
   */
  public readonly isSSR: boolean = false
  /**
   * 是否为 hydration 模式
   *
   * @default false
   */
  public readonly isHydration: boolean = false
  /**
   * 构建应用实例
   *
   * @param node - 根节点/小部件
   * @param config - 配置选项
   */
  protected constructor(node: WidgetType, config?: AppConfig) {
    if (typeof node === 'function') {
      this.#rootNode = createVNode(node) as StatefulWidgetNode
    } else if (isStatefulWidgetNode(node)) {
      this.#rootNode = node
    } else {
      throw new Error('The root node must be a widget')
    }
    // 使用展开运算符合并配置，提供默认错误处理
    this.config = this.initConfig(config)
    this.#rootNode.appContext = this
    this.#rootNode.provide('App', this)
  }

  /**
   * 获取当前应用的根节点
   *
   * @returns {StatefulWidgetNode} 返回根组件节点
   */
  get rootNode(): StatefulWidgetNode {
    return this.#rootNode
  }

  /**
   * 注册异步渲染任务
   *
   * 此方法在服务端渲染时会被内部渲染逻辑调用，如果是异步渲染的组件，
   * 则会注册 Promise 对象，监听对象可得知是否渲染完成。
   *
   * ssr 应用app可以实现此方法，来完成服务端渲染。
   *
   * @param {Promise<unknown>} promise - 需要注册的Promise对象，该Promise不返回任何值（void类型）
   */
  public registerRenderPromise?(promise: Promise<unknown>): void

  /**
   * 初始化应用配置
   *
   * @param config 可选的应用配置对象
   * @return {Required<AppConfig>} 返回一个包含完整配置的对象，所有必需属性都已设置
   */
  protected initConfig(config?: AppConfig): Required<AppConfig> {
    // 使用展开运算符合并配置，提供默认错误处理
    // 将默认配置与传入的配置合并，传入的配置会覆盖默认配置中的相同属性
    return {
      errorHandler: defaultErrorHandler, // 设置默认的错误处理函数
      idPrefix: 'v', // 设置默认的ID前缀
      ...config // 展开传入的配置对象，覆盖默认值
    }
  }

  /**
   * 在App上下文中执行函数
   *
   * @template T - 函数返回值的类型
   * @param {() => T} fn - 需要在指定上下文中执行的函数
   * @returns {T} 函数执行后的返回值
   */
  runInContext<T>(fn: () => T): T {
    return runInAppContext(this, fn)
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
   * 检查提供者是否存在
   *
   * @param name - 要检查的提供者名称，可以是字符串或Symbol类型
   * @returns {boolean} 如果存在对应的提供者则返回true，否则返回false
   */
  hasProvide(name: string | symbol): boolean {
    return this.#provide.has(name) // 使用Set的has方法检查是否存在对应的提供者
  }
  /**
   * 获取注入值的方法
   *
   * @template T - 注入值的类型
   * @param name - 要获取的注入值的名称，可以是字符串或symbol类型
   * @param defaultValue - 可选参数，当指定名称的注入值不存在时返回的默认值
   * @returns {T} 返回获取到的注入值，如果不存在则返回默认值
   */
  inject<T = any>(name: string | symbol, defaultValue?: T): T {
    return this.#provide.get(name) ?? defaultValue
  }

  /**
   * ## 安装插件
   *
   * @param {Function|Object} plugin - 无配置选项的插件
   * @returns {this} - 返回应用实例本身，支持链式调用
   */
  use(plugin: NonConfigurationPlugins | { install: NonConfigurationPlugins }): this
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
    if (!plugin) throw new Error('[Vitarx.App.use][ERROR]: The plugin cannot be empty.')
    const pluginType = typeof plugin
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
