import { isFunction } from '../../utils/index.js'
import { type ClassWidgetConstructor, isClassWidgetConstructor, Widget } from '../widget/widget.js'
import type { FnWidgetConstructor } from '../widget/index.js'
import { createVNode, isVNode, type VNode, type WidgetType } from '../vnode/index.js'
import { mountVNode, renderWidgetElement } from './web-runtime-dom/index.js'
import CoreLogger from '../CoreLogger.js'

// 错误提示
const ERROR_MESSAGE = '还未渲染小部件，或小部件已经卸载'

/**
 * ## Vitarx App
 *
 * Vitarx 应用渲染器
 */
export class AppRenderer {
  /** 元素容器 */
  protected readonly container: Element
  /** 配置选项 */
  protected readonly options: Required<Vitarx.AppOptions> = {
    ssr: false
  }
  /**
   * 小部件实例
   */
  #widget: Widget | null = null
  /**
   * 实例容器
   * @private
   */
  #instances: Map<string, any> = new Map()

  /**
   * 构建应用实例
   *
   * @param container
   * @param options
   */
  constructor(container: Element, options?: Vitarx.AppOptions) {
    if (!(container instanceof Element)) {
      throw new Error('[Vitarx]：根容器必须是Element实例。')
    }
    this.container = container
    this.options = Object.assign(this.options, options)
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
      throw new Error(
        `[Vitarx.AppRenderer.render][ERROR]：入口小部件必须是函数声明小部件或类声明小部件。`
      )
    }
    renderWidgetElement(vnode, this.container)
    this.#widget = vnode.instance!
    if (this.#widget['renderer'].state !== 'notMounted') {
      throw new Error(
        `[Vitarx.AppRenderer.render][ERROR]：Vitarx应用主入口渲染失败，请修复控制台输出的异常。`
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
      CoreLogger.warn('AppRenderer.update', `${ERROR_MESSAGE}，不能执行更新操作。`)
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
      CoreLogger.warn('AppRenderer.unmount', `${ERROR_MESSAGE}，不能执行卸载操作。`)
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
      CoreLogger.warn('AppRenderer.activate', `${ERROR_MESSAGE}，不能执行激活操作。`)
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
      CoreLogger.warn('AppRenderer.deactivate', `${ERROR_MESSAGE}，不能执行停用操作。`)
    } else {
      this.#widget?.['renderer'].deactivate()
    }
  }

  /**
   * ## 注册实例
   *
   * 将实例注册到应用容器中，可以通过别名获取
   *
   * @template T - 实例类型
   * @param {string} name - 实例别名
   * @param {T} instance - 实例对象
   * @returns {this} - 返回应用实例本身，支持链式调用
   */
  register(name: string, instance: Object): this {
    this.#instances.set(name, instance)
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
    return (this.#instances.get(name) as T) || undefined
  }
}

/**
 * ## 创建一个应用实例
 *
 * @param container - 根容器元素，也可以是选择器`selector`，内部自动使用 `document.querySelector` 查找元素。
 * @param options - 应用配置
 * @returns {Vitarx} - 应用实例
 */
export function createApp(container: Element | string, options?: Vitarx.AppOptions): AppRenderer {
  if (typeof container === 'string') {
    container = document.querySelector(container)!
  }
  return new AppRenderer(container, options)
}
