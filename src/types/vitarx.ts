import { Fragment as VFragment } from '../index'
import { Widget } from '../core/widgets'
import HtmlIntrinsicElements from './html-elements'

declare const PLAIN_PROXY_SYMBOL: unique symbol
declare const PROXY_SYMBOL: unique symbol
declare const REF_OBJECT_TARGET_SYMBOL: unique symbol
declare global {
  /**
   * 值代理对象
   */
  type Ref<T> = Vitarx.Ref<T>
  /**
   * 响应式代理对象
   */
  type Reactive<T extends Vitarx.ReactiveTarget> = Vitarx.Reactive<T>
  namespace Vitarx {
    namespace JSX {
      /**
       * @inheritDoc
       */
      interface IntrinsicElements extends HtmlIntrinsicElements {}

      /**
       * 内置属性
       */
      type IntrinsicAttributes = {
        /**
         * 节点唯一标识符，用于 diff，列表元素应当具有唯一key
         */
        key?: string
      }
    }
    // 片段标识
    type Fragment = typeof VFragment
    // 任意属性
    type AnyProps = Record<string, any>
    /**
     * 类声明小部件
     */
    type ClassWidget = Widget
    /**
     * 函数声明小部件组件
     *
     * @example
     * ```ts
     * type MyWidgetProps = {
     *   children: Vitarx.VNodeType
     * }
     * const MyWidget = (props: Vitarx.AnyProps) => <div>{props.children}</div>
     * export App = () => <MyWidget>Hello World</MyWidget>
     * // 渲染结果：<div>Hello World</div>
     * ```
     */
    type FunctionWidget = (props: AnyProps) => VNode
    /**
     * 节点类型
     */
    type VNodeType = string | Fragment | FunctionWidget | ClassWidget
    /**
     * 子节点
     */
    type Children = Array<string | VNode>

    /**
     * VNode用于描述节点类型、属性、子节点，有以下四种元素类型：
     *
     * 1. {@link IntrinsicElements}：HTML固有元素，固有元素总是以一个小写字母开头，如`div`、`span`等。
     * 2. {@link FunctionWidget}：函数声明的小部件，命名规范需以一个大写字母开头。
     * 3. {@link Widget}：类声明小部件，命名规范需以一个大写字母开头，且需继承自`Widget`类。
     * 4. {@link Fragment}：对应jsx中的`<></>`片段语法。
     *
     * @property {VNodeType} type - 节点类型
     * @property {AnyProps} props - 节点属性
     * @property {VNode[]} children - 子节点列表
     */
    interface VNode {
      type: VNodeType
      props: AnyProps | null
      children: Children
    }

    // 响应式代理相关

    /**
     * ## 值代理对象
     *
     * 普通类型变量，如字符串、数字、布尔等，需要使用`.value`访问和修改。
     *
     * 对象和数组类型，直接访问和修改。
     *
     * @template T - 被代理变量的类型
     */
    interface Ref<T = any> {
      [PLAIN_PROXY_SYMBOL]: true
      [PROXY_SYMBOL]: true

      get value(): RefTarget<T>

      set value(_: T)
    }

    // 代理目标类型
    type RefTarget<T> = T extends ReactiveTarget ? RefObjectTarget<T> : T
    // 代理对象目标
    type RefObjectTarget<T extends ReactiveTarget = ReactiveTarget> = Reactive<T> & {
      [REF_OBJECT_TARGET_SYMBOL]: true
    }
    // 代理目标类型
    type ReactiveTarget = Record<any, any> | any[]
    // 响应式代理，对象、数组。
    type Reactive<T extends ReactiveTarget = ReactiveTarget> = T & { [PROXY_SYMBOL]: true }
    // 代理类型
    type Proxy<T = any> = T extends object ? Reactive<T> | Ref<T> : Ref<T>
    // 排除代理符号类型
    type ExcludeProxySymbol<T> = Exclude<T, ProxySymbol>
    // 所有代理类型
    type AllProxyInterface = Reactive | Ref | RefObjectTarget
    // 代理符号
    type ProxySymbol =
      | typeof PLAIN_PROXY_SYMBOL
      | typeof PROXY_SYMBOL
      | typeof REF_OBJECT_TARGET_SYMBOL
    // 解除代理类型
    type UnProxy<T extends AllProxyInterface> = {
      [K in keyof Omit<T, ProxySymbol>]: T[K] extends AllProxyInterface ? UnProxy<T[K]> : T[K]
    }
  }
}
