// 错误提示
import {
  type ClassWidgetConstructor,
  type FnWidgetConstructor,
  isClassWidgetConstructor,
  Widget
} from './widget/index.js'
import { createVNode, isVNode, provide, type VNode, type WidgetType } from './vnode/index.js'
import { isFunction, Logger } from '../utils/index.js'
import { mountVNode, renderWidgetElement } from './renderer/web-runtime-dom/index.js'

const ERROR_MESSAGE = '还未渲染小部件或小部件已经卸载'

/** 应用配置 */
export interface AppOptions {
  /**
   * 是否为服务端渲染
   *
   * 此配置功能暂未支持，可能会在之后的版本中支持。
   *
   * @default false
   */
  ssr?: boolean
}
/**
 * ## Vitarx App
 *
 * 用于创建和运行 Vitarx 应用。
 */
export class App {
  /**
   * 日志实例
   * @private
   */
  static #logger: Logger | undefined
  /** 配置选项 */
  protected readonly options: Required<AppOptions> = {
    ssr: false
  }
  /** 元素容器 */
  protected readonly container: Element
  /**
   * 小部件实例
   */
  #widget: Widget | null = null
  /**
   * 实例容器
   * @private
   */
  #data: Map<string, any> = new Map()
  // 向下提供的数据
  #provides: Record<string | symbol, any> | undefined = undefined

  /**
   * 构建应用实例
   *
   * @param container
   * @param options
   */
  constructor(container: Element, options?: AppOptions) {
    if (!(container instanceof Element)) {
      throw new Error('[Vitarx]：根容器必须是Element实例。')
    }
    this.container = container
    Object.assign(this.options, options)
  }

  /**
   * 日志实例
   *
   * > 注意：该静态属性是为了开发者能便捷地使用框架内置的一个日志输出工具，
   * 它不是框架中核心日志管理器，如果需处理框架核心日志，请使用`CoreLogger.setCustomHandler`。
   *
   * ```ts
   * App.log.setCustomHandler((level: string, message: string, tag: string) => {
   *   // 上传日志到服务器
   * })
   * App.log.error('错误信息')
   * App.log.warn('警告信息')
   * App.log.info('信息提示')
   * App.log.debug('调试信息')
   * ```
   */
  static get log() {
    if (!this.#logger) {
      this.#logger = new Logger('App')
    }
    return this.#logger
  }

  /**
   * 获取版本号
   *
   * @returns {string} - 版本号
   */
  static get version(): string {
    return __VERSION__
  }

  /**
   * 小部件实例
   *
   * 未渲染之前返回null
   */
  get widget(): Widget | null {
    return this.#widget
  }

  /**
   * ## 渲染小部件
   *
   * @template P - 小部件的props参数
   * @param {WidgetType<P> | VNode<WidgetType<P>>} widget - 入口小部件
   * @param {object} props - 小部件的props参数，仅在widget为函数或类时可选。
   */
  render<P extends Record<string, any>>(widget: WidgetType<P> | VNode, props?: P): this {
    let vnode: VNode<FnWidgetConstructor | ClassWidgetConstructor>
    if (isFunction(widget) || isClassWidgetConstructor(widget)) {
      vnode = createVNode(widget as FnWidgetConstructor, props)
    } else {
      vnode = widget as VNode<FnWidgetConstructor | ClassWidgetConstructor>
    }
    if (!isVNode(vnode) || !isFunction(vnode.type)) {
      throw new Error(`[Vitarx.App.render][ERROR]：入口小部件必须是函数声明小部件或类声明小部件。`)
    }
    // 向下提供数据
    if (this.#provides) {
      vnode.provide = this.#provides
      vnode.provide.App = this
      this.#provides = undefined
    } else {
      vnode.provide = { App: this }
    }

    renderWidgetElement(vnode, this.container)
    this.#widget = vnode.instance!

    if (this.#widget['renderer'].state !== 'notMounted') {
      throw new Error(
        `[Vitarx.App.render][ERROR]：Vitarx应用主入口渲染失败，请修复控制台输出的异常。`
      )
    }
    mountVNode(vnode)
    return this
  }

  /**
   * ## 更新App
   *
   * 等于`widget.update()`强制更新视图
   */
  update(): void {
    if (!this.#widget) {
      throw new Error(`[Vitarx.App.update][ERROR]：${ERROR_MESSAGE}，不能执行更新操作。`)
    } else {
      this.#widget['renderer'].update()
    }
  }

  /**
   * ## 卸载APP
   *
   * 卸载小部件，释放资源，并移除挂载的元素。
   *
   * 该操作是不可逆的，如果你只是暂时性的移除`App`，请使用`deactivate`方法。
   */
  unmount(): void {
    if (!this.#widget) {
      throw new Error(`[Vitarx.App.unmount][ERROR]：${ERROR_MESSAGE}，不能执行卸载操作。`)
    } else {
      this.#widget['renderer'].unmount()
      this.#widget = null
    }
  }

  /**
   * ## 激活App
   *
   * 恢复已经停用的小部件，重新挂载到目标容器中。
   */
  activate(): void {
    if (!this.#widget) {
      throw new Error(`[Vitarx.App.activate][ERROR]：${ERROR_MESSAGE}，不能执行激活操作。`)
    } else {
      this.#widget?.['renderer'].activate()
    }
  }

  /**
   * ## 停用App
   *
   * 可以让渲染的小部件临时处于挂起状态，直到调用`activate`方法激活才会重新挂载到目标容器中。
   */
  deactivate(): void {
    if (!this.#widget) {
      throw new Error(`[Vitarx.App.deactivate][ERROR]：${ERROR_MESSAGE}，不能执行停用操作。`)
    } else {
      this.#widget?.['renderer'].deactivate()
    }
  }

  /**
   * ## 注册任意数据到容器中
   *
   * 将数据注册到应用容器中，可以通过别名获取
   *
   * @template T - 实例类型
   * @param {string} name - 数据索引
   * @param {any} data - 数据，可以是类型的值
   * @returns {this} - 返回应用实例本身，支持链式调用
   */
  register(name: string, data: any): this {
    this.#data.set(name, data)
    return this
  }

  /**
   * 应用级数据提供
   *
   * @param {string | symbol} name - 注入名称
   * @param {any} value - 注入值
   */
  provide(name: string | symbol, value: any): this {
    if (this.widget) {
      provide(name, value, this.widget)
    } else {
      if (!this.#provides) {
        this.#provides = { [name]: value }
      } else {
        this.#provides[name] = value
      }
    }
    return this
  }

  /**
   * ## 获取实例
   *
   * 通过别名获取已注册的实例
   *
   * @template T - 实例类型
   * @param {string} name - 实例别名
   * @returns {T | undefined} - 返回实例，如果不存在则返回undefined
   */
  get<T = any>(name: string): T | undefined {
    return (this.#data.get(name) as T) || undefined
  }
}

/**
 * ## 创建一个应用实例
 *
 * @param container - 根容器元素，也可以是选择器`selector`，内部自动使用 `document.querySelector` 查找元素。
 * @param options - 应用配置
 * @returns {Vitarx} - 应用实例
 */
export function createApp(container: Element | string, options?: Vitarx.AppOptions): App {
  if (typeof container === 'string') {
    container = document.querySelector(container)!
  }
  return new App(container, options)
}
