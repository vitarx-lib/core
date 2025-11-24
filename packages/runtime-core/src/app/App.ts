import { NON_SIGNAL_SYMBOL } from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import { __VITARX_VERSION__ } from '../constants/index.js'
import { useRenderer } from '../renderer/index.js'
import { runInAppContext } from '../runtime/index.js'
import type {
  Directive,
  DirectiveOptions,
  ErrorInfo,
  HostParentElement,
  StatefulWidgetVNode,
  VNode,
  WidgetTypes
} from '../types/index.js'
import { isContainerNode } from '../utils/index.js'
import { createWidgetVNode, mountNode, unmountNode } from '../vnode/index.js'

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

export class App {
  readonly [NON_SIGNAL_SYMBOL] = true
  /** 配置选项 */
  public readonly config: Required<AppConfig>
  /**
   * 根节点
   * @private
   */
  readonly #rootNode: VNode
  /**
   * 提供数据
   * @private
   */
  readonly #provide: Map<string | symbol, any> = new Map()
  /**
   * 应用作用域的指令
   * @private
   */
  readonly #directives: Map<string, Directive> = new Map()
  /**
   * 构建应用实例
   *
   * @param root - 根组件 / 根节点
   * @param config - 配置选项
   */
  constructor(root: VNode | WidgetTypes, config?: AppConfig) {
    if (typeof root === 'function') {
      this.#rootNode = createWidgetVNode(root, {})
    } else {
      this.#rootNode = root
    }
    // 使用展开运算符合并配置，提供默认错误处理
    this.config = this.initConfig(config)
    this.injectAppContext(this.#rootNode)
  }

  /**
   * 获取当前应用的根节点
   *
   * @returns {StatefulWidgetVNode} 返回根组件节点
   */
  get rootNode(): VNode {
    return this.#rootNode
  }

  /**
   * 为虚拟节点树注入应用上下文
   * @param node - 要注入应用上下文的根虚拟节点
   * @private
   */
  private injectAppContext(node: VNode) {
    // 递归遍历节点树，为每个节点设置应用作用域
    const traverse = (node: VNode) => {
      node.appContext = this
      if (isContainerNode(node)) {
        for (const child of node.children) {
          traverse(child)
        }
      }
    }
    traverse(node)
  }

  /**
   * 获取版本号
   *
   * @returns {string} - 版本号
   */
  get version(): string {
    return __VITARX_VERSION__
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
  mount(container: HostParentElement | string): this {
    // 如果传入的是字符串，则通过querySelector获取对应的DOM元素
    if (typeof container === 'string') {
      container = useRenderer().querySelector(container)!
      // 如果找不到对应的DOM元素，抛出错误
      if (!container) {
        throw new Error(
          `[Vitarx.createApp][ERROR]: The element corresponding to the specified selector ${container} was not found.`
        )
      }
    }
    // 调用组件的mount方法，将组件挂载到指定的容器中
    mountNode(this.rootNode, container)
    // 返回当前组件实例，支持链式调用
    return this
  }
  /**
   * 卸载应用的方法
   * 该方法用于执行组件的卸载操作，清理相关资源
   */
  unmount(): void {
    unmountNode(this.rootNode)
  }
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
   * 获取指令
   *
   * @overload
   * @param {string} name - 指令名称
   * @returns {Directive | undefined} 已注册的指令，如果不存在则返回 undefined
   *
   *
   * @example
   * ```js
   * // 获取已注册的指令
   * const focusDirective = app.directive('focus');
   * ```
   */
  directive(name: string): Directive | undefined
  /**
   * 注册指令
   *
   * @overload
   * @param {string} name - 指令名称
   * @param {DirectiveOptions} directive - 指令选项（可选）
   * @returns {this} 根据参数不同返回不同类型
   *
   * @example
   * // 注册一个指令
   * app.directive('focus', {
   *   mounted(el) {
   *     el.focus();
   *   }
   * });
   *
   * @example
   * ```js
   * // 获取已注册的指令
   * const focusDirective = app.directive('focus');
   * ```
   *
   * @example
   * ```js
   * // 链式注册多个指令
   * app
   *   .directive('click-outside', clickOutsideDirective)
   *   .directive('lazy-load', lazyLoadDirective);
   * ```
   */
  directive(name: string, directive: DirectiveOptions): this
  /**
   * 注册或获取指令的方法
   *
   * @param name - 指令名称，会自动去除前后空格
   * @param [directive] - 可选，指令配置对象
   * @returns 如果传入 directive 参数，返回 this 实例以支持链式调用；
   *          如果未传入 directive 参数，返回获取到的指令对象或 undefined
   */
  directive(name: string, directive?: DirectiveOptions): Directive | undefined | this {
    // 去除指令名称前后的空格
    name = name.trim()
    if (directive) {
      // 如果没有提供指令名称，抛出类型错误
      if (!name) throw new TypeError('The directive name cannot be empty')
      ;(directive as Directive).name = name
      this.#directives.set(name, directive as Directive)
      return this
    } else {
      return this.#directives.get(name)
    }
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
