import { type ErrorInfo, LifeCycle, LifeCycleHooks } from './life-cycle.js'
import type { ContainerElement } from '../renderer/index.js'
import { WidgetRenderer } from '../renderer/index.js'
import {
  getCurrentVNode,
  inject,
  type IntrinsicAttributes,
  provide,
  type VNode,
  type WidgetVNode
} from '../vnode/index.js'
import { getCurrentScope, Scope } from '../scope/index.js'
import { _callLifeCycleHook } from './internal.js'

/**
 * `Element`等同于`VNode`，兼容TSX类型检测。
 */
export type Element = Vitarx.Element
/**
 * 类组件构造器类型
 *
 * @alias ClassWidgetType
 */
export type ClassWidgetConstructor<P extends Record<string, any> = any> = new (
  props: P & IntrinsicAttributes
) => Widget<P, any>
/**
 * 类组件构造器类型
 */
export type ClassWidgetType<P extends Record<string, any> = any> = ClassWidgetConstructor<P>
/**
 * 此类型用于推导出组件的子节点类型。
 */
export type WidgetChildren<P> = P extends { children: infer U }
  ? U
  : P extends { children?: infer U }
    ? U | undefined
    : undefined

const CLASS_WIDGET_BASE_SYMBOL = Symbol('WIDGET_SYMBOL')

/**
 * 所有小部件的基类
 *
 * @template InputProps - 输入的属性类型
 * @template Props - `this.props`的类型，默认=InputProps
 *
 * `Props`泛型详细说明：假设`InputProps`中有一个name是可选的字符串属性，
 * 在构造函数或`onBeforeCreate`钩子中通过`defineProps({name:'小明'})`给name赋予一个默认值，
 * 当你调用`this.props.name`获取数据时，`this.props.name`的类型任会是string|undefined，
 * 这是TS类型推导的问题，满屏的错误提示需使用`!`强制断言不为空，
 * 为了解决这个问题我们可以传入`Props`泛型来重载`this.props`的类型，就像下面那样：
 * ```tsx
 * import {defineProps} from 'vitarx'
 * interface MyProps {
 *   name?:string,
 *   age?:number
 * }
 * // 注意第二个泛型，我们使用Ts类型工具Required来将所有属性标记为必填的，然后在构造函数中给所有属性都定义一个默认值
 * // 当然你也可以只为某些属性定义默认值，可以传入`MakeRequired<MyProps,'name'>`，
 * // MakeRequired是框架内置的全局类型工具，支持挑选部分接口属性，使其成为不能为空的必填属性，
 * class MyWidget extends Widget<MyProps,Required<MyProps> {
 *   constructor(props:MyProps){
 *    super(props)
 *    // 使用助手函数给props属性赋予默认值
 *    defineProps({name:'小明',age:18})
 *    const name:string = this.props.name // 如果你没有给Widget传入第二个泛型 这里就会提示类型错误
 *   }
 * }
 * ```
 */
export abstract class Widget<
  InputProps extends Record<string, any> = {},
  Props extends InputProps = InputProps
> extends LifeCycle {
  /**
   * 内部私有属性，用于存放接收的`prop`
   *
   * @private
   */
  private readonly _$props: InputProps
  /**
   * 内部私有属性，存放组件自身vnode节点
   *
   * @private
   */
  private readonly _$vnode: WidgetVNode
  /**
   * 内部私有属性，存放作用域实例
   *
   * @private
   */
  private readonly _$scope: Scope
  /**
   * 内部私有属性，可以通过此属性判断类是否继承了Widget基类。
   *
   * @internal
   */
  static [CLASS_WIDGET_BASE_SYMBOL] = true
  /**
   * 内部私有属性，用于存放渲染器实例。
   *
   * @internal
   * @private
   */
  private _$renderer?: WidgetRenderer<this>
  constructor(props: InputProps) {
    super()
    this._$props = props
    this._$vnode = getCurrentVNode()!
    this._$scope = getCurrentScope()!
    this.onBeforeCreate?.call(this)
  }

  /**
   * 在组件实例创建之前调用的生命周期钩子
   *
   * 此钩子在构造函数内部执行，在组件的属性、虚拟节点和作用域初始化之后，但在完整实例创建完成之前被调用。
   * 可以在此钩子中执行一些初始化逻辑，但此时组件的渲染器尚未创建，不能访问DOM元素。
   *
   * @example
   * ```ts
   * class MyWidget extends Widget<MyProps> {
   *   protected onBeforeCreate() {
   *     // 定义默认props
   *     defineProps({name:'小明',age:18})
   *   }
   * }
   * ```
   */
  protected onBeforeCreate?(): void

  /**
   * 获取小部件渲染的节点元素
   *
   * 如果小部件已经渲染，则返回小部件的`DOM`元素，否则返回`null`。
   *
   * > 注意：如果是片段元素，`DocumentFragment` 则需要使用this.el.__backup数组访问元素。
   *
   * @returns {ContainerElement | undefined}
   */
  get el(): ContainerElement | undefined {
    return this._$renderer?.el
  }
  /**
   * 外部传入的属性
   *
   * 建议保持单向数据流，不要尝试修改`props`中数据。
   *
   * 你可以在构造函数中使用`defineProps`来定义默认的props数据。
   */
  protected get props(): Readonly<InputProps & Props> {
    return this._$props as InputProps & Props
  }

  /**
   * 作用域
   *
   * @internal 该获取器被内部逻辑依赖，请勿重写！
   * @protected
   */
  protected get scope(): Scope {
    return this._$scope
  }

  /**
   * 获取小部件自身的虚拟节点
   *
   * @internal 该获取器被内部逻辑依赖，请勿重写！
   * @protected
   * @returns {WidgetVNode}
   */
  protected get vnode(): Readonly<WidgetVNode> {
    return this._$vnode
  }

  /**
   * 获取外部传入的子节点
   *
   * `children` 不会自动渲染，你可以将它视为一个参数，你可以在`build`方法中使用该参数，来实现插槽的效果。
   */
  protected get children(): WidgetChildren<InputProps> {
    return this._$props.children
  }

  /**
   * 初始化渲染器实例
   *
   * 子类可以重写此方法返回一个自定义的渲染器实例，此方法在组件生命周期内只会被调用一次，是内部核心方法。
   *
   * @protected
   * @internal
   */
  protected initializeRenderer(): WidgetRenderer<this> {
    return new WidgetRenderer(this)
  }

  /**
   * 注入依赖
   *
   * 等同于调用`inject(name, defaultValue, this)`
   *
   * @template T
   * @param {string | symbol} name 依赖名称
   * @param {T} defaultValue 默认值
   * @returns {T}
   * @protected
   */
  protected inject<T>(name: string | symbol, defaultValue?: T): T {
    return inject(name, defaultValue, this)
  }

  /**
   * 提供依赖
   *
   * 等同于调用`provide(name, value, this)`
   *
   * @param {string | symbol} name - 依赖名称
   * @param {any} value - 依赖值
   * @protected
   */
  protected provide(name: string | symbol, value: any): void {
    provide(name, value, this)
  }

  /**
   * 获取渲染器实例。
   *
   * > 注意：切勿重写该`getter`，如果需要自定义渲染器，可重写`initializeRenderer`方法，并返回渲染器实例。
   *
   * @internal
   * @protected
   */
  protected get renderer(): WidgetRenderer<this> {
    if (!this._$renderer) {
      this._$renderer = this.initializeRenderer()
      if (import.meta.env?.MODE === 'development') {
        if (!this.vnode.__$HMR_STATE$__) {
          _callLifeCycleHook(this, LifeCycleHooks.created)
        }
      } else {
        // 触发onCreated生命周期
        _callLifeCycleHook(this, LifeCycleHooks.created)
      }
    }
    return this._$renderer
  }

  /**
   * 强制更新视图
   *
   * 如果你修改了非响应式数据，则可以调用此方法，强制更新视图。
   *
   * @param {VNode} newChildVNode - 可选的新`child`虚拟节点，如果不提供，则使用`build`方法构建。
   * @protected
   */
  protected update(newChildVNode?: VNode) {
    this.renderer.update(newChildVNode)
  }

  /**
   * 报告异常
   *
   * 一般无需调用此方法，除非有特殊的情况。
   *
   * @param {unknown} error - 捕获到的异常
   * @param {ErrorInfo} info - 错误信息
   * @returns {any} - 异常处理器返回值
   * @internal 此方法是核心方法，请勿肆意重写，它维护了异常处理的核心逻辑！！！
   * @protected
   */
  protected reportError(error: unknown, info: ErrorInfo): any {
    return _callLifeCycleHook(this, LifeCycleHooks.error, error, info)
  }

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
  protected abstract build(): Element | null
}

/**
 * 辅助判断一个构造函数是否为类组件
 *
 * @alias isClassWidgetConstructor
 * @param {any} val - 待判断的值
 * @returns {val is ClassWidgetConstructor} - 如果是类组件则返回true，否则返回false
 */
export function isClassWidget(val: any): val is ClassWidgetConstructor {
  return val?.[CLASS_WIDGET_BASE_SYMBOL] === true
}

export { isClassWidget as isClassWidgetConstructor }
