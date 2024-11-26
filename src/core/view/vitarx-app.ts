import { renderWidgetElement } from './web-render/index.js'
import { isFunction } from '../../utils/index.js'
import { type ClassWidget, isClassWidget, Widget } from './widget.js'
import type { FnWidget } from './fn-widget.js'
import { createVNode, isVNode, type VNode } from './VNode.js'

// 错误提示
const ERROR_MESSAGE = '还未渲染小部件，或小部件已经卸载'

/**
 * # Vitarx App
 */
export class VitarxApp {
  static ssr: boolean = false
  /** 元素容器 */
  protected readonly container: Element
  /** 配置选项 */
  protected readonly options: Required<Vitarx.AppOptions> = {
    ssr: false
  }
  /**
   * 小部件实例
   */
  widget: Widget | null = null
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
    VitarxApp.ssr = this.options.ssr
  }

  /**
   * 获取版本号
   *
   * @returns {string} - 版本号
   */
  static get version(): string {
    return '__VERSION__'
  }

  /**
   * ## 渲染小部件
   *
   * @param {ClassWidget | FnWidget | VNode} widget - 入口小部件
   * @param {object} props - 小部件的props参数，仅在widget为函数或类时可选。
   */
  render<P extends Record<string, any>>(
    widget: ClassWidget<P> | FnWidget<P> | VNode,
    props?: P
  ): void {
    let vnode: VNode<FnWidget | ClassWidget>
    if (isFunction(widget) || isClassWidget(widget)) {
      vnode = createVNode(widget as FnWidget, props)
    } else {
      vnode = widget as VNode<FnWidget | ClassWidget>
    }
    if (!isVNode(vnode) || !isFunction(vnode.type)) {
      throw new Error(`[Vitarx]：入口小部件必须是函数声明小部件或类声明小部件。`)
    }
    renderWidgetElement(vnode, this.container)
    this.widget = vnode.instance!
  }

  /**
   * ## 更新App
   *
   * 等于`widget.update()`强制更新视图
   */
  update(): void {
    if (!this.widget) {
      console.warn(`[VitarxApp.update]：${ERROR_MESSAGE}，不能执行更新操作。`)
    } else {
      this.widget.renderer.update()
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
    if (!this.widget) {
      console.warn(`[VitarxApp.unmount]：${ERROR_MESSAGE}，不能执行卸载操作。`)
    } else {
      this.widget.renderer.unmount()
      this.widget = null
    }
  }

  /**
   * ## 激活App
   *
   * 恢复已经停用的小部件，重新挂载到目标容器中。
   */
  activate(): void {
    if (!this.widget) {
      console.warn(`[VitarxApp.activate]：${ERROR_MESSAGE}，不能执行停用操作。`)
    } else {
      this.widget?.renderer.activate()
    }
  }

  /**
   * ## 停用App
   *
   * 可以让渲染的小部件临时处于挂起状态，直到调用`activate`方法激活才会重新挂载到目标容器中。
   */
  deactivate(): void {
    if (!this.widget) {
      console.warn(`[VitarxApp.deactivate]：${ERROR_MESSAGE}，不能执行启用操作。`)
    } else {
      this.widget?.renderer.deactivate()
    }
  }
}

/**
 * ## 创建一个应用实例
 *
 * @param container - 根容器元素，也可以是选择器`selector`，内部自动使用 `document.querySelector` 查找元素。
 * @param options - 应用配置
 * @returns {Vitarx} - 应用实例
 */
export function createApp(container: Element | string, options?: Vitarx.AppOptions): VitarxApp {
  if (typeof container === 'string') {
    container = document.querySelector(container)!
  }
  return new VitarxApp(container, options)
}
