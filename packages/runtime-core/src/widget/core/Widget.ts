import { EffectScope, NON_SIGNAL_SYMBOL } from '@vitarx/responsive'
import { CLASS_WIDGET_BASE_SYMBOL } from '../../constants/index.js'
import { getCurrentVNode, VNodeUpdate } from '../../runtime/index.js'
import type {
  AnyProps,
  ErrorInfo,
  ExtractChildrenPropType,
  MergeProps,
  NodeElementType,
  VNodeChild
} from '../../types/index.js'
import { __DEV__ } from '../../utils/index.js'
import { StatefulWidgetNode, VNode } from '../../vnode/index.js'

/**
 * 所有小部件的基类
 *
 * @template InputProps - 输入的属性类型
 * @template DefaultProps - `this.props`的类型，默认=InputProps
 *
 * @remarks
 * `DefaultProps` 泛型详细说明：假设`InputProps`中有一个属性类型是可选的string，
 * 但在组件内通过 `defineProps` 定义了默认值，调用`this.props.name`获取数据时，`this.props.name`的类型是string|undefined，
 * 这是TS类型推导的问题，满屏的错误提示需使用`!`强制断言不为空，为了解决这个问题我们可以传入`DefaultProps`泛型来重载`this.props`的类型，
 *
 * @example `DefaultProps` 泛型使用
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
 *    defineProps({name:'小明',age:18}) // 定义默认属性
 *    const name:string = this.props.name // 如果你没有给Widget传入第二个泛型 这里就会提示类型错误
 *   }
 * }
 * export default MyWidget
 * ```
 */
export abstract class Widget<
  InputProps extends AnyProps = {},
  DefaultProps extends AnyProps | Partial<InputProps> = InputProps
> {
  /**
   * 类小部件标识符符
   */
  static [CLASS_WIDGET_BASE_SYMBOL] = true
  /**
   * 禁止代理小部件实例
   */
  readonly [NON_SIGNAL_SYMBOL] = true
  /**
   * 属性验证函数。
   *
   * 用于校验传入的 props 是否符合预期
   *
   * 校验时机：仅开发模式下节点创建之前进行校验
   *
   * 校验结果说明：
   * - `string`：校验失败但不影响节点运行，打印该自定义异常提示。
   * - `false`：打印默认的参数错误信息。
   * - throw new Error('自定义异常')：如果不希望继续渲染组件，则可以抛出异常，异常将会由父级捕获并处理。
   * - 其他值/void：校验通过。
   *
   * 框架在开发模式下会自动捕获异常并将其转换为校验错误。
   *
   * @since 4.0.0
   * @param props - 传入的组件属性对象
   * @returns {string | false | unknown} 校验结果
   */
  static validateProps?: (props: AnyProps) => string | false | unknown
  /**
   * Props默认值
   *
   * 会在创建组件实例时自动注入到props中
   *
   * 需注意：props在组件实例中是一个只读响应式代理，
   * defaultProps 中的属性通过 in props 判断是无效的，它只在获取属性时有效
   *
   * @since 4.0.0
   * @example defaultProps 静态属性的使用
   * ```tsx
   * interface UserInfoProps {
   *   name:string,
   *   age:number
   * }
   * class UserInfo extends Widget<UserInfoProps> {
   *   static defaultProps = {
   *     age:18
   *   }
   *   onCreate() {
   *    console.log(this.props.name,this.props.age) // 小明 18
   *   }
   *   build() {
   *    return <div>{this.props.name}-{this.props.age}</div>
   *   }
   * }
   *
   * function App() {
   *  // age 会被推导为可选的，不传入不会报错
   *  return <UserInfo name="小明"/>
   * }
   * ```
   */
  static defaultProps?: AnyProps
  /**
   * 存储小部件的传入属性
   *
   * @private
   */
  readonly #props: InputProps
  /**
   * 小部件关联的虚拟节点
   *
   * @private
   */
  readonly #vnode: StatefulWidgetNode

  constructor(props: InputProps) {
    this.#vnode = getCurrentVNode()!
    if (__DEV__ && !this.#vnode) {
      throw new Error('The Widget instance must be created in the context of the WidgetVNode')
    }
    this.#props = props
    this.onCreate?.call(this)
  }

  /**
   * 获取小部件的属性
   * @returns {Readonly<InputProps & DefaultProps>}
   */
  get props(): Readonly<MergeProps<InputProps, DefaultProps>> {
    return this.#props as unknown as MergeProps<InputProps, DefaultProps>
  }

  /**
   * 获取当前小部件的子节点列表
   *
   * 这是一个getter方法，用于返回当前小部件的子节点列表
   *
   * @returns {ExtractChildrenPropType<InputProps>} 返回子节点列表
   */
  get children(): ExtractChildrenPropType<MergeProps<InputProps, DefaultProps>> {
    return (this.props as unknown as Record<'children', any>).children as ExtractChildrenPropType<
      MergeProps<InputProps, DefaultProps>
    >
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
   * @returns { NodeElementType } 返回虚拟节点对应的 DOM 元素实例
   */
  get $el(): NodeElementType {
    return this.#vnode.element
  }

  /**
   * 获取小部件的虚拟DOM节点
   * @returns {StatefulWidgetNode} 返回小部件的虚拟DOM节点
   */
  get $vnode(): StatefulWidgetNode {
    return this.#vnode
  }

  /**
   * 小部件实例创建时调用
   *
   * 此时完全处于节点上下文中
   */
  onCreate?(): void

  /**
   * 在组件被挂载之前调用。
   *
   * 在此钩子被调用时，还没有创建真实DOM元素，因此不能访问DOM元素，
   * 切勿此时访问实例中的$el属性会导致无限循环！
   */
  onBeforeMount?(): void

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
   * @returns {VNode | false | void} 如果返回备用ui或false，事件都不会继续冒泡！
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
  onError?(error: unknown, info: ErrorInfo): VNode | false | void

  /**
   * 小部件渲染前钩子
   *
   * - 在客户端渲染时，其执行时机等同于 onBeforeMount。
   *   如果返回 Promise，不会阻塞渲染，依赖响应式更新机制会自动触发视图更新。
   *
   * - 在服务端渲染（SSR）时：
   *   - 渲染流程会先渲染一个占位节点。
   *   - 如果返回 Promise，Promise 完成后会用真实节点替换占位节点。
   *   - 这种行为类似异步组件的渲染逻辑，保证 SSR 不被阻塞。
   *
   * 使用建议：
   * - 可在此钩子中处理异步数据获取、依赖初始化等操作。
   * - 如果希望客户端在数据未加载完成时不渲染真实组件，应使用异步组件。
   *
   * @returns {Promise<unknown> | void} - 可返回 Promise 以延迟占位节点替换为真实节点，客户端不会阻塞渲染。
   */
  onRender?(): Promise<unknown> | void

  /**
   * 构建`UI`元素。
   *
   * 该方法会被多次调用，所以在方法内不应该存在任何副作用。
   *
   * > **注意**：在类小部件的build方法中不要返回 `() => VNodeChild`，而是应返回直接 `VNodeChild`。
   *
   * 示例：
   * ```ts
   * // JSX语法
   * build() {
   *   return <div>Hello World</div>
   * }
   * // 使用 `createVNode` API函数创建虚拟节点/元素
   * build() {
   *  return createVNode('div',{},'Hello World')
   * }
   * ```
   * @remarks 该方法应由子类实现，且该方法仅供内部渲染逻辑使用。
   * @returns { VNodeChild } - 返回VNode节点或null
   */
  abstract build(): VNodeChild

  /**
   * 对组件渲染的根节点执行打补丁（Patch）更新操作。
   *
   * 框架内部会根据 `currentVNode` 与 `nextVNode` 的差异，
   * 选择性地执行复用、更新或销毁并替换节点。
   *
   * 如需自定义特殊更新逻辑，可重写此方法，但需谨慎！
   * 默认使用 VNodeUpdate.patchUpdate 进行差异计算和更新。
   *
   * @param currentVNode - 当前已渲染的虚拟节点
   * @param nextVNode - 目标虚拟节点描述，将被用于对比更新
   * @returns {VNode} 更新后的虚拟节点（可能是原节点或新节点）
   */
  $patchUpdate(currentVNode: VNode, nextVNode: VNode): VNode {
    return VNodeUpdate.patch(currentVNode, nextVNode)
  }

  /**
   * 强制更新小部件
   */
  $forceUpdate(): void {
    this.$vnode.update()
  }
}
