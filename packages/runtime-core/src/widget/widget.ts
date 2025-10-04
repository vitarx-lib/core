import { EffectScope } from '@vitarx/responsive'
import { getCurrentVNode } from '../vnode/context.js'
import {
  type AnyElement,
  type MergeProps,
  type RuntimeElement,
  type VNode,
  type WidgetVNode
} from '../vnode/index.js'
import { VNodeUpdate } from '../vnode/update.js'
import { CLASS_WIDGET_BASE_SYMBOL } from './constant.js'
import { type ClassWidget, type ErrorInfo } from './types/index.js'

/**
 * VNode类型的别名
 */
export type Element = VNode
export type VitarxElement = VNode
/**
 * 此类型用于推导出小部件的子节点类型。
 */
type WidgetChildren<P> = P extends { children: infer U }
  ? U
  : P extends { children?: infer U }
    ? U | undefined
    : never

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
  DefaultProps extends InputProps = InputProps
> {
  /**
   * 类小部件标识符符
   */
  static [CLASS_WIDGET_BASE_SYMBOL] = true
  /**
   * 小部件关联的虚拟节点
   *
   * @private
   */
  readonly #vnode: WidgetVNode
  /**
   * 存储小部件的传入属性
   *
   * @private
   */
  readonly #props: InputProps

  constructor(props: InputProps) {
    this.#vnode = getCurrentVNode()!
    if (!this.#vnode) {
      throw new Error('The Widget instance must be created in the context of the WidgetVNode')
    }
    this.#props = props
    if (import.meta.env?.MODE !== 'development' || !this.#vnode.__$HMR_STATE$__) {
      // 仅在非开发环境或开发环境不处于HMR模式下，才触发 create 生命周期钩子
      // 切记不能使用this.#vnode.triggerLifecycleHook触发钩子，会导致无限循环
      this.onCreate?.call(this)
    }
  }

  /**
   * 获取小部件的属性
   * @returns {Readonly<InputProps & Props>}
   */
  get props(): Readonly<MergeProps<InputProps, DefaultProps>> {
    return this.#props as unknown as MergeProps<InputProps, DefaultProps>
  }

  /**
   * 获取当前小部件的子节点列表
   *
   * 这是一个getter方法，用于返回当前小部件的子节点列表
   *
   * @returns {WidgetChildren<InputProps>} 返回子节点列表
   */
  get children(): WidgetChildren<InputProps> {
    return this.#vnode.children as WidgetChildren<InputProps> // 将vnode的children转换为WidgetChildren类型并返回
  }

  /**
   * 获取作用域对象的getter方法
   * @returns {EffectScope} 返回内部的作用域对象#scope
   */
  get $scope(): EffectScope {
    return this.$vnode.scope
  }

  /**
   * 获取当前虚拟节点对应的 DOM 元素
   * 这是一个 getter 属性，用于返回小部件或虚拟节点挂载后的真实 DOM 元素
   * @returns {AnyElement} 返回虚拟节点对应的 DOM 元素实例
   */
  get $el(): AnyElement {
    return this.#vnode.element
  }

  /**
   * 获取小部件的虚拟DOM节点
   * @returns {WidgetVNode} 返回小部件的虚拟DOM节点
   */
  get $vnode(): WidgetVNode {
    return this.#vnode
  }

  /**
   * 判断给定的值是否为 ClassWidget 类型的实例
   *
   * @param val - 需要检查的值
   * @returns {val is ClassWidget} - 如果值是 ClassWidget 类型返回 true，否则返回 false
   *
   * @remarks
   * 该方法通过检查对象上是否存在特定的符号属性 CLASS_WIDGET_BASE_SYMBOL，
   * 并且该属性的值为 true 来判断对象是否为 ClassWidget 类型。
   *
   * @example
   * ```typescript
   * const widget = new SomeWidget();
   * console.log(isClassWidget(widget)); // 取决于 widget 是否实现了 ClassWidget 接口
   * ```
   */
  static isClassWidget(val: any): val is ClassWidget {
    return val?.[CLASS_WIDGET_BASE_SYMBOL] === true
  }

  /**
   * 小部件实例创建时调用
   *
   * 此时完全处于节点上下文中
   */
  onCreate?(): void

  /**
   * 挂载渲染完成之后，元素挂载之前被调用。
   *
   * @example
   * ```ts
   * class MyWidget extends Widget {
   *   onBeforeMount() {
   *     // 挂载到指定的容器元素中
   *     return document.querySelector('#container')! // 返回 #container 选择器是等效的
   *   }
   * }
   * ```
   */
  onBeforeMount?(): void | string | ParentNode

  /**
   * 小部件挂载后调用
   * 在小部件被挂载到DOM后触发，此时可以访问DOM元素
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
   * 小部件激活时调用
   * 当缓存的小部件重新被激活时触发
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
   * 小部件停用时调用
   * 当小部件被缓存时触发
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
   * 小部件更新前调用
   *
   * 在小部件即将重新渲染之前触发
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
   * 小部件状态更新后调用
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
   * 小部件被卸载完成后调用
   */
  onUnmounted?(): void

  /**
   * 小部件即将被卸载时调用
   *
   * 此时小部件功能还完全可用
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   onUnmount() {
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
  onBeforeUnmount?(): void

  /**
   * 错误处理钩子
   *
   * @param error - 捕获到的错误
   * @param info - 错误的详细信息
   * @returns {VNode|void} 备用UI，如果返回null或undefined，则不显示备用UI
   *
   * @example
   * ```tsx
   * class MyWidget extends Widget {
   *   onError(error: unknown, info: ErrorInfo) {
   *     // 记录错误日志
   *     console.error(`Error in ${info.source}:`, error)
   *
   *     // 返回备用UI
   *     return <div>小部件发生错误，请刷新页面重试</div>
   *   }
   * }
   * ```
   */
  onError?(error: unknown, info: ErrorInfo): Element | void

  /**
   * 移除元素前调用
   *
   * 在小部件的视图元素被即将被移除时触发，可用于执行离开动画等，需注意元素布局冲突！
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

  /**
   * 构建`UI`元素。
   *
   * 该方法会被多次调用，所以在方法内不应该存在任何副作用。
   *
   * > **注意**：在类小部件的build方法中不要返回 `() => VitarxElement`，而是应返回`VitarxElement`。
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
   * @remarks 该方法应由子类实现，且该方法仅供内部渲染逻辑使用。
   * @returns {VitarxElement|null} - 返回VNode节点或null
   */
  abstract build(): VitarxElement | null

  /**
   * 对虚拟节点进行打补丁更新操作
   *
   * 默认使用VNodeUpdate.patchUpdate进行更新节点，如需特殊处理更新逻辑，可自行实现此方法！
   *
   * @param oldVNode - 旧的虚拟节点，表示更新前的DOM状态
   * @param newVNode - 新的虚拟节点，表示更新后的DOM状态
   * @returns {VNode} 返回更新后的虚拟节点
   */
  $patchUpdate(oldVNode: Element, newVNode: Element): Element {
    return VNodeUpdate.patchUpdate(oldVNode, newVNode) // 调用VNodeHelper的patchUpdate方法执行具体的更新逻辑
  }

  /**
   * 更新子节点VNode的方法
   * 本方法主要用于手动强制更新视图
   *
   * @param {VNode} newChildVNode 可选参数，新的子节点虚拟节点
   */
  update(newChildVNode?: Element): void {
    // 调用当前虚拟节点的updateChild方法，传入新的子节点VNode进行更新
    this.$vnode.updateChild(newChildVNode)
  }
}
