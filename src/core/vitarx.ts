import { createFnWidget, type IntrinsicAttributes, isClassWidget, Widget } from './view/index.js'
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
    /**
     * 类小部件
     *
     * @example
     * ```ts
     * import {Widget,createVNode} from 'vitarx'
     * class App extends Widget{
     *  build(){
     *    return <div>widget</div>
     *  }
     * }
     * ```
     */
    type ClassWidget<T extends Record<string, any> = {}> = import('./view/widget').ClassWidget<T>
    /**
     * ## 函数式小部件
     *
     * ### JS|TS 语法示例
     * @example
     * ```ts
     * function App(){
     *  const count = ref(0)
     *  return () => createVNode('div',{style:{color:'red'}},count.value)
     * }
     * ```
     *
     * ### JSX|TSX 语法示例
     * @example
     * ```tsx
     * function App(){
     *  const count = ref(0)
     *  // 返回`build`构建器，引用的响应式变量发生变化时，会自动更新视图
     *  return () => <div>{count.value}</div>
     * }
     * function StaticApp(){
     *  // 如果组件是无状态的，则可以直接返回元素
     *  return <div>hello world!</div>
     * }
     * ```
     */
    type FnWidget<T extends Record<string, any> = {}> = import('./view/fn-widget').FnWidget<T>
    /**
     * 兼容JSX语法检测
     *
     * ```tsx
     * function App(){
     *  const count = ref(0)
     *  // 返回`build`构建器，引用的响应式变量发生变化时，会自动更新视图
     *  return () => <div>{count.value}</div>
     * }
     * function StaticApp(){
     *  // 如果组件是无状态的，则可以直接返回元素
     *  return <div>hello world!</div>
     * }
     * ```
     */
    type Element = () => Element
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
