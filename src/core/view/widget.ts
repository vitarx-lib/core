import { type IntrinsicAttributes, type VElement, type VNode } from './VNode.js'
import { WidgetRenderer } from './renderer.js'
import { __WidgetPropsSelfNodeSymbol__ } from './constant.js'
import type { FnWidgetConstructor } from './fn-widget.js'
import { LifeCycle } from './life-cycle.js'

interface WidgetGetterInterface<P> {
  get vnode(): VNode<ClassWidget | FnWidgetConstructor>

  get el(): VElement | null

  get children(): WidgetChildren<P>

  get props(): DeepReadonly<P>

  get renderer(): WidgetRenderer
}

/**
 * `Element`等同于`VNode`，兼容TSX类型检测。
 */
export type Element = Vitarx.Element

/**
 * 类组件构造器类型
 */
export type ClassWidget<P extends Record<string, any> = {}> = new (
  props: P & IntrinsicAttributes
) => Widget<P>

// 获取组件子节点类型
export type WidgetChildren<P> = P extends { children: infer U }
  ? U
  : P extends {
        children?: infer U
      }
    ? U | undefined
    : undefined

/**
 * 组件基类
 */
export abstract class Widget<P extends Record<string, any> = {}>
  extends LifeCycle
  implements WidgetGetterInterface<P>
{
  /**
   * 内部私有属性，用于存放接收的`prop`
   *
   * @private
   */
  readonly #props: P
  /**
   * 内部私有属性，用于存放渲染器实例。
   *
   * 如需自定义渲染器，可重写`renderer`属性获取器。
   *
   * @private
   */
  #renderer?: WidgetRenderer
  /**
   * ## 实例化
   *
   * @param props
   */
  constructor(props: P) {
    super()
    this.#props = props
  }

  /**
   * 获取小部件自身的虚拟节点
   *
   * 该获取器被内部依赖，请勿重写！
   *
   * @returns {VNode<ClassWidget>}
   */
  get vnode(): VNode<ClassWidget> {
    return this.#props[__WidgetPropsSelfNodeSymbol__ as any]
  }

  /**
   * 该方法由`Vitarx`内部调用，用于渲染
   *
   * 请勿在外部调用，以及使用`WidgetRenderer`实例方法，避免内存泄露。
   *
   * @protected
   */
  get renderer(): WidgetRenderer {
    if (!this.#renderer) {
      // @ts-ignore 兼容热更新
      if (import.meta.env?.MODE === 'development') {
        // @ts-ignore 如果是类组件，恢复其属性值
        if (this.vnode.instance && isClassWidget(this.vnode.type)) {
          // 如果是修改build则恢复状态，修改其他方法则不恢复状态，重新触发创建和挂载生命周期
          if (this.vnode.instance.build.toString() === this.build.toString()) {
            this.onCreated?.()
            this.#renderer = new WidgetRenderer(this)
            this.onMounted?.()
            return this.#renderer
          } else {
            for (const key in this.vnode.instance) {
              // @ts-ignore
              const oldValue = this.vnode.instance[key]
              // 函数类型不恢复
              if (typeof oldValue !== 'function') {
                // @ts-ignore
                this[key] = oldValue
              }
            }
          }
        }
      }
      this.#renderer = new WidgetRenderer(this)
    }
    return this.#renderer
  }

  /**
   * 外部传入的属性
   *
   * 建议保持单向数据流，不要尝试修改`props`中数据。
   */
  get props(): DeepReadonly<P> {
    return this.#props as DeepReadonly<P>
  }

  /**
   * 获取外部传入的子节点
   *
   * `children` 不会自动渲染，你可以将它视为一个参数，你可以在`build`方法中使用该参数，来实现插槽的效果。
   */
  get children(): WidgetChildren<P> {
    return this.props.children as WidgetChildren<P>
  }

  /**
   * 获取小部件渲染的节点元素
   *
   * 如果小部件已经渲染，则返回小部件的`DOM`元素，否则返回`null`。
   *
   * > 注意：如果是片段元素，`el` 会是一个数组，如果片段元素没有子节点，
   * 则数组中会存在一个占位的`Text`节点，它的内容的空的，在浏览器中不会显示视图。
   *
   * @returns {VElement | null}
   */
  get el(): VElement | null {
    return this.renderer.el
  }

  /**
   * 强制更新视图
   *
   * 如果你修改了非响应式数据，则可以调用此方法，强制更新视图。
   *
   * @protected
   */
  update() {
    this.renderer.update()
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
   * // 使用`h`或`createElement` API函数创建元素
   * build() {
   *  return h('div',{},'Hello World')
   * }
   * ```
   * @note 该方法应由子类实现，且该方法是受保护的，仅供内部渲染逻辑使用。
   * @protected
   * @returns {Element} - 返回的是虚拟的VNode节点
   */
  abstract build(): Element
}

/**
 * 判断是否为类构造器
 *
 * @param val
 */
export function isClassWidget(val: any): val is ClassWidget {
  if (typeof val !== 'function') return false
  return val.prototype instanceof Widget
}
