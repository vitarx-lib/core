import { EffectScope, getCurrentScope } from '@vitarx/responsive'
import {
  getCurrentVNode,
  type RuntimeElement,
  type VNode,
  type WidgetVNode
} from '../../vnode/index'
import type { ErrorInfo } from '../types/error'
import { CLASS_WIDGET_BASE_SYMBOL, LifecycleHooks } from './constant'
import { triggerLifecycleHook, WidgetRenderer } from './manager/index'

/**
 * 此类型用于推导出组件的子节点类型。
 */
type WidgetChildren<P> = P extends { children: infer U }
  ? U
  : P extends { children?: infer U }
    ? U | undefined
    : undefined

/**
 * 所有小部件的基类
 *
 * @template InputProps - 输入的属性类型
 * @template Props - `this.props`的类型，默认=InputProps
 *
 * @remarks
 * `Props`泛型详细说明：假设`InputProps`中有一个name属性类型是可选的string，
 * 但通过 `defineProps` 定义了默认值，调用`this.props.name`获取数据时，`this.props.name`的类型是string|undefined，
 * 这是TS类型推导的问题，满屏的错误提示需使用`!`强制断言不为空，为了解决这个问题我们可以传入`Props`泛型来重载`this.props`的类型，
 * 就像下面那样：
 *
 * @example
 * ```tsx
 * import {defineProps} from 'vitarx'
 * interface MyProps {
 *   name?:string,
 *   age?:number
 * }
 * // 注意第二个泛型，我们使用Ts类型工具Required来将所有属性标记为必填的
 * class MyWidget extends Widget<MyProps,Required<MyProps> {
 *   constructor(props:MyProps){
 *    super(props)
 *    const name:string = this.props.name // 如果你没有给Widget传入第二个泛型 这里就会提示类型错误
 *   }
 * }
 * defineProps(MyWidget,{name:'小明',age:18})
 * export default MyWidget
 * ```
 */
export abstract class Widget<
  InputProps extends Record<string, any> = {},
  Props extends InputProps = InputProps
> {
  static [CLASS_WIDGET_BASE_SYMBOL]: true
  /**
   * 存储组件的传入属性
   *
   * @private
   */
  readonly #props: InputProps
  /**
   * 存储组件的作用域
   *
   * @private
   */
  readonly #scope: EffectScope
  /**
   * 存储组件的虚拟节点
   *
   * @private
   */
  readonly #vnode: WidgetVNode
  /**
   * 存储组件的渲染器实例
   *
   * @private
   */
  #renderer: WidgetRenderer<this> | null = null
  public constructor(props: InputProps) {
    this.#props = props
    this.#scope = getCurrentScope()!
    this.#vnode = getCurrentVNode()!
    if (!this.#scope) throw new Error('Widget must be created in a EffectScope')
    if (import.meta.env?.MODE !== 'development' || !this.#vnode.__$HMR_STATE$__) {
      // 仅在非开发环境或开发环境不处于HMR模式下，才会触发生命周期钩子
      triggerLifecycleHook(this, LifecycleHooks.create)
    }
  }
  /**
   * 获取组件的 EffectScope
   *
   * @returns {EffectScope}
   * @internal 该获取器被内部逻辑依赖，请勿重写！
   */
  get scope(): EffectScope {
    return this.#scope
  }
  /**
   * 组件接收到的属性
   *
   * 建议保持单向数据流，不要尝试修改`props`中数据。
   */
  get props(): Readonly<InputProps & Props> {
    return this.#props as InputProps & Props
  }
  /**
   * 获取小部件自身的虚拟节点
   *
   * @returns {WidgetVNode}
   * @internal 该获取器被内部逻辑依赖，请勿重写！
   */
  get vnode(): WidgetVNode {
    return this.#vnode
  }
  /**
   * 获取组件的子节点
   *
   * `children` 不会自动渲染，你可以在`build`方法中使用该属性，来实现插槽的效果。
   */
  get children(): WidgetChildren<InputProps> {
    return this.#props.children
  }
  /**
   * 组件创建时调用
   *
   * 等同于在 `constructor` 构造函数中执行初始化逻辑。
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   private data = ref([])
   *   private timer: null|number = null
   *   onCreate() {
   *     // 初始化组件的响应式数据
   *     this.data.value = ['初始数据']
   *     // 设置定时器或订阅事件
   *     const this.timer = setInterval(() => this.updateData(), 1000)
   *   }
   *   onUnmounted(){
   *    // 在组件卸载时清理
   *      clearInterval(this.timer)
   *    }
   * }
   * ```
   */
  onCreate?(): void
  /**
   * 强制更新视图
   *
   * 如果你修改了非响应式数据，则可以调用此方法，强制更新视图。
   *
   * @param {VNode} newChildVNode - 可选的新`child`虚拟节点，如果不提供，则使用`build`方法构建。
   * @protected
   */
  protected update(newChildVNode?: VNode) {}
  /**
   * 构建`UI`元素。
   *
   * 该方法会被多次调用，所以在方法内不应该存在任何副作用。
   *
   * > **注意**：在类组件的build方法中不要返回 `() => Element`，而是应返回`Element`。
   *
   * 示例：
   * ```ts
   * // JSX语法
   * build() {
   *   return <div>Hello World</div>
   * }
   * // 使用`createVNode`或`createElement` API函数创建元素
   * build() {
   *  return createVNode('div',{},'Hello World')
   * }
   * ```
   * @note 该方法应由子类实现，且该方法是受保护的，仅供内部渲染逻辑使用。
   * @protected
   * @returns {Element} - 返回的是虚拟的VNode节点
   */
  protected abstract build(): VNode | null
  /**
   * 组件挂载前调用
   * 在组件即将首次渲染挂载到DOM之前触发
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   onBeforeMount() {
   *     // 在组件挂载前准备数据
   *     const theme = localStorage.getItem('theme')
   *     document.body.classList.add(theme)
   *
   *     // 可以返回一个字符串选择器，以挂载到指定的容器元素
   *     return '#root'
   *   }
   * }
   * ```
   */
  onBeforeMount?(): string | void

  /**
   * 获取渲染器实例。
   *
   * @internal 该获取器被内部逻辑依赖，谨慎重写！
   */
  get renderer(): WidgetRenderer<this> {
    if (!this.#renderer) {
      this.#renderer = new WidgetRenderer(this)
    }
    return this.#renderer
  }
  /**
   * 组件挂载后调用
   * 在组件被挂载到DOM后触发，此时可以访问DOM元素
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   onMounted() {
   *     // 访问和操作DOM元素
   *     const container = document.querySelector('.container')
   *     // 添加事件监听器
   *     container.addEventListener('scroll', this.handleScroll)
   *     // 初始化第三方库
   *     new ThirdPartyLib(container)
   *   }
   *
   *   private handleScroll = () => {
   *     // 处理滚动事件
   *   }
   * }
   * ```
   */
  onMounted?(): void
  /**
   * 组件激活时调用
   * 当缓存的组件重新被激活时触发
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   private websocket: WebSocket
   *
   *   onActivated() {
   *     // 重新连接WebSocket
   *     this.websocket = new WebSocket('ws://example.com')
   *     this.websocket.onmessage = this.handleMessage
   *
   *     // 恢复轮询
   *     this.startPolling()
   *   }
   *
   *   private handleMessage = (event) => {
   *     // 处理WebSocket消息
   *   }
   * }
   * ```
   */
  onActivated?(): void
  /**
   * 组件停用时调用
   * 当组件被缓存时触发
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   private websocket: WebSocket
   *   private polling: number
   *
   *   onDeactivated() {
   *     // 断开WebSocket连接
   *     this.websocket?.close()
   *     // 停止轮询
   *     clearInterval(this.polling)
   *     // 保存当前状态
   *     localStorage.setItem('widgetState', JSON.stringify(this.state))
   *   }
   * }
   * ```
   */
  onDeactivated?(): void
  /**
   * 组件更新前调用
   * 在组件即将重新渲染之前触发
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   private prevScrollPosition: number
   *
   *   onBeforeUpdate() {
   *     // 记录更新前的状态
   *     this.prevScrollPosition = window.scrollY
   *     // 保存表单未提交的数据
   *     const form = document.querySelector('form')
   *     if (form) {
   *       sessionStorage.setItem('formData', new FormData(form).toString())
   *     }
   *   }
   * }
   * ```
   */
  onBeforeUpdate?(): void
  /**
   * 组件更新后调用
   * 在组件重新渲染后触发
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   private prevScrollPosition: number
   *
   *   onUpdated() {
   *     // 恢复滚动位置
   *     window.scrollTo(0, this.prevScrollPosition)
   *     // 更新图表
   *     this.chart?.update()
   *     // 重新计算布局
   *     this.updateLayout()
   *   }
   *
   *   private updateLayout() {
   *     // 更新布局逻辑
   *   }
   * }
   * ```
   */
  onUpdated?(): void
  /**
   * 组件卸载后调用
   * 在组件从DOM中移除后触发
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   onUnmounted() {
   *     // 清理事件监听器
   *     window.removeEventListener('resize', this.handleResize)
   *     // 清理定时器
   *     clearInterval(this.timer)
   *     // 销毁第三方库实例
   *     this.chart?.destroy()
   *   }
   *
   *   private handleResize = () => {
   *     // 处理窗口大小变化
   *   }
   * }
   * ```
   */
  onUnmounted?(): void
  /**
   * 组件卸载前调用
   * 在组件即将从DOM中移除之前触发
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   onBeforeUnmount() {
   *     // 提示用户保存未保存的更改
   *     if (this.hasUnsavedChanges()) {
   *       const confirmed = window.confirm('您有未保存的更改，确定要离开吗？')
   *       if (!confirmed) {
   *         throw new Error('用户取消了组件卸载')
   *       }
   *     }
   *     // 保存状态到localStorage
   *     localStorage.setItem('widgetState', JSON.stringify(this.state))
   *   }
   *
   *   private hasUnsavedChanges() {
   *     // 检查是否有未保存的更改
   *     return true
   *   }
   * }
   * ```
   */
  onBeforeUnmount?(): void
  /**
   * 组件错误处理钩子
   * 当组件渲染过程中出现错误时触发
   * @param error - 捕获到的错误
   * @param info - 错误的详细信息
   * @returns 可选的错误处理结果
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   onError(error: unknown, info: ErrorInfo) {
   *     // 记录错误日志
   *     console.error(`Error in ${info.source}:`, error)
   *
   *     // 显示用户友好的错误提示
   *     const errorMessage = document.createElement('div')
   *     errorMessage.className = 'error-message'
   *     errorMessage.textContent = '组件发生错误，请刷新页面重试'
   *
   *     // 返回备用UI
   *     return errorMessage
   *   }
   * }
   * ```
   */
  onError?(error: unknown, info: ErrorInfo): any
  /**
   * 组件移除前调用
   *
   * 在元素被移除前触发，可用于执行离开动画等，需注意元素布局冲突！
   *
   * @param el - 将要被移除的HTML元素
   * @param type - 移除的类型，可能是卸载或停用
   * @returns {Promise<void>} - Promise解析后根元素才会被移除
   * @example
   * return new Promise((resolve) => {
   *   this.el.style.opacity = 0 // 设置元素透明度
   *   setTimeout(resolve, 300) // 延迟300ms后移除元素
   * })
   */
  onBeforeRemove?<T extends RuntimeElement>(el: T, type: 'unmount' | 'deactivate'): Promise<void>
  /**
   * 服务端预取钩子
   *
   * 在服务端渲染期间获取数据
   *
   * @returns {Promise<void>} - Promise解析后继续服务端渲染流程
   */
  onServerPrefetch?(): Promise<void>
}
