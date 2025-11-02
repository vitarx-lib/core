import { NON_SIGNAL_SYMBOL } from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import type { ErrorInfo, WidgetType } from '../types/index.js'
import { isStatefulWidgetNode, StatefulWidgetNode } from '../vnode/index.js'
import { createVNode } from '../vnode/utils/helper.js'
import { runInAppContext } from './context.js'

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
  logger.error('uncaught exceptions', error, info)
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
  readonly #node: StatefulWidgetNode
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
  protected constructor(node: WidgetType, config?: AppConfig) {
    if (typeof node === 'function') {
      this.#node = createVNode(node) as StatefulWidgetNode
    } else if (isStatefulWidgetNode(node)) {
      this.#node = node
    } else {
      throw new Error('The root node must be a widget')
    }
    // 使用展开运算符合并配置，提供默认错误处理
    this.config = {
      errorHandler: defaultErrorHandler,
      idPrefix: 'v-',
      ...config
    } as Required<AppConfig>
    this.#node.appContext = this
    this.#node.provide('App', this)
  }

  /**
   * 获取当前组件的虚拟DOM节点(VNode)
   * @returns {StatefulWidgetNode} 返回当前组件的虚拟DOM节点实例
   */
  get node(): StatefulWidgetNode {
    return this.#node
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
