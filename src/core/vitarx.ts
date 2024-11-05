import { Widget } from './view'

declare global {
  namespace Vitarx {
    /** 应用配置 */
    interface AppOptions {
      /** 是否启用服务端渲染 */
      ssr?: boolean
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
   * 构建应用实例
   *
   * @param container
   * @param options
   */
  constructor(container: Element, options?: Vitarx.AppOptions) {
    if (!(container instanceof Element)) {
      throw new Error('根容器必须是Element实例。')
    }
    this.container = container
    this.options = Object.assign(this.options, options)
    Vitarx.ssr = this.options.ssr
  }

  render(widget: Widget): void {
    // @ts-ignore 忽略受保护类型检查
    widget.createElement().mount(this.container)
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
