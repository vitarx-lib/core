import {
  createFnWidget,
  type IntrinsicAttributes,
  isClassWidget,
  type Widget
} from './view/index.js'
import { createScope } from './scope/index.js'

declare global {
  namespace Vitarx {
    /** 应用配置 */
    interface AppOptions {
      /** 是否启用服务端渲染 */
      ssr?: boolean
    }

    type GlobalIntrinsicAttributes = IntrinsicAttributes
    type VNode = import('./view/VNode').VNode
    type ClassWidget<T extends Record<string, any> = {}> = import('./view/widget').ClassWidget<T>
    type FnWidget<T extends Record<string, any> = {}> = import('./view/fn-widget').FnWidget<T>
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

  render<P extends Record<string, any>>(
    app: Vitarx.ClassWidget<P> | Vitarx.FnWidget<P>,
    props: P
  ): void {
    createScope(() => {
      let instance: Widget
      if (isClassWidget(app)) {
        instance = new app(props || {})
      } else {
        instance = createFnWidget(app as Vitarx.FnWidget<P>, props)
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
