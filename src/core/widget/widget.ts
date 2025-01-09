import { LifeCycle, LifeCycleHooks } from './life-cycle.js'
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

/**
 * `Element`等同于`VNode`，兼容TSX类型检测。
 */
export type Element = Vitarx.Element
/**
 * 类组件构造器类型
 */
export type ClassWidgetConstructor<P extends Record<string, any> = any> = new (
  props: P & IntrinsicAttributes
) => Widget<P>

// 获取组件子节点类型
export type WidgetChildren<P> = P extends { children: infer U }
  ? U
  : P extends { children?: infer U }
    ? U | undefined
    : undefined

/**
 * 所有小部件的基类
 *
 * @template InputProps - 输入的属性类型
 * @template Props - `this.props`的类型，默认=InputProps，如果你使用了`defineDefaultProps`方法来定义默认属性，而InputProps中又是定义的可选属性，则可以传入该泛型来重载`this.props`的类型。
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
  readonly #props: Props
  // 自身VNODE
  readonly #vnode: WidgetVNode
  // 自身作用域
  readonly #scope: Scope

  constructor(props: InputProps) {
    super()
    this.#props = props as Props
    this.#vnode = getCurrentVNode()!
    this.#scope = getCurrentScope()!
  }

  /**
   * 内部私有属性，用于存放渲染器实例。
   *
   * 不要重写该属性！！！
   *
   * @private
   * @internal
   */
  protected _renderer?: WidgetRenderer<this>

  /**
   * 获取渲染器实例。
   *
   * > 注意：切勿重写该`getter`，如果需要自定义渲染器，可重写`initializeRenderer`方法，并返回渲染器实例。
   *
   * @internal
   * @protected
   */
  protected get renderer(): WidgetRenderer<this> {
    if (!this._renderer) {
      this._renderer = this.initializeRenderer()
      if (import.meta.env?.MODE === 'development') {
        // @ts-ignore
        if (!this.vnode['__$hmr_state$__']) {
          this.callLifeCycleHook(LifeCycleHooks.created)
        }
      } else {
        // 触发onCreated生命周期
        this.callLifeCycleHook(LifeCycleHooks.created)
      }
    }
    return this._renderer
  }

  /**
   * 外部传入的属性
   *
   * 建议保持单向数据流，不要尝试修改`props`中数据。
   */
  protected get props(): Readonly<Props> {
    return this.#props as Readonly<Props>
  }

  /**
   * 作用域
   *
   * @internal 该获取器被内部逻辑依赖，请勿重写！
   * @protected
   */
  protected get scope(): Scope {
    return this.#scope
  }

  /**
   * 获取小部件自身的虚拟节点
   *
   * @internal 该获取器被内部逻辑依赖，请勿重写！
   * @protected
   * @returns {WidgetVNode}
   */
  protected get vnode(): Readonly<WidgetVNode> {
    return this.#vnode
  }

  /**
   * 获取外部传入的子节点
   *
   * `children` 不会自动渲染，你可以将它视为一个参数，你可以在`build`方法中使用该参数，来实现插槽的效果。
   */
  protected get children(): WidgetChildren<InputProps> {
    return this.props.children as WidgetChildren<InputProps>
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
   * 获取小部件渲染的节点元素
   *
   * 如果小部件已经渲染，则返回小部件的`DOM`元素，否则返回`null`。
   *
   * > 注意：如果是片段元素，`DocumentFragment` 则需要使用this.el.__backup数组访问元素。
   *
   * @returns {ContainerElement | undefined}
   */
  get el(): ContainerElement | undefined {
    return this._renderer?.el
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
  protected abstract build(): Element
}

/**
 * 判断是否为类构造器
 *
 * @param val
 */
export function isClassWidgetConstructor(val: any): val is ClassWidgetConstructor {
  if (typeof val !== 'function') return false
  return val.prototype instanceof Widget
}
