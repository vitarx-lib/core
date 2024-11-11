import {
  type ClassWidget,
  createFnWidget,
  type FnWidget,
  type IntrinsicAttributes,
  isClassWidget,
  Widget
} from './view/index.js'
import { createScope } from './scope/index.js'

declare global {
  namespace Vitarx {
    /** 应用配置 */
    interface AppOptions {
      /** 是否启用服务端渲染 */
      ssr?: boolean
    }

    /**
     * 全局属性
     *
     * - `ref`: 用于绑定元素实例。
     * - `key`: 用于绑定元素节点的key，支持`key.value`获取key值。
     */
    type GlobalIntrinsicAttributes = IntrinsicAttributes
    /**
     * 虚拟节点
     */
    type VNode = import('./view/VNode').VNode
    namespace Jsx {
      /** 元素类型 */
      type Element = () => Element
      /** 类组件实例 */
      type ElementClass = Widget
    }
  }
}

/**
 * # Vitarx App
 */
export class Vitarx {
  static ssr: boolean = false
  /** 元素容器 */
  protected readonly container: Element
  /** 配置选项 */
  protected readonly options: Required<Vitarx.AppOptions> = {
    ssr: false
  }
  /**
   * 小部件基类
   */
  static Widget = Widget
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
    Vitarx.ssr = this.options.ssr
  }

  /**
   * 渲染小部件
   *
   * @param widget - 入口小部件
   * @param props - 小部件的props参数
   */
  render<P extends Record<string, any>>(widget: ClassWidget<P> | FnWidget<P>, props?: P): void {
    createScope(() => {
      let instance: Widget
      if (isClassWidget(widget)) {
        instance = new widget(props || {})
      } else {
        instance = createFnWidget(widget as FnWidget<P>, props as any)
      }
      instance.renderer.mount(this.container)
    })
  }
}

/**
 * ## 创建一个应用实例
 *
 * @param container - 根容器元素，也可以是选择器`selector`，内部自动使用 `document.querySelector` 查找元素。
 * @param options - 应用配置
 * @returns {Vitarx} - 应用实例
 */
export function createApp(container: Element | string, options?: Vitarx.AppOptions): Vitarx {
  if (typeof container === 'string') {
    container = document.querySelector(container)!
  }
  return new Vitarx(container, options)
}
