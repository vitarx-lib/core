import { Fragment as VFragment } from '../index'
import { Widget } from '../core/widgets'
import HtmlIntrinsicElements from './html-elements'
import type { IS_PLAIN_PROXY_SYMBOL, IS_PROXY_SYMBOL } from '../core/proxy/proxy.js'

declare global {
  /**
   * ## Vitarx响应式变量代理
   *
   * 基本类型变量，如字符串、数字、布尔等，需要使用`.value`访问和修改。
   *
   * 对象和数组类型，直接访问和修改。
   *
   * @example
   * ```ts
   * import { ref } from 'vitarx'
   *
   * // 创建基本类型响应式变量
   * const count = ref(0)
   * count.value++
   *
   * // 创建对象响应式变量
   * const state = ref({ count: 0 })
   * state.count++
   *
   * // 创建数组响应式变量
   * const list = ref([1, 2, 3])
   * list.push(4)
   * console.log(list[3]) // 4
   * ```
   *
   * @template T - 被代理变量的类型
   */
  type Ref<T> = Vitarx.Ref<T>
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

    /**
     * ## Vitarx响应式变量代理
     *
     * 普通类型变量，如字符串、数字、布尔等，需要使用`.value`访问和修改。
     *
     * 对象和数组类型，直接访问和修改。
     *
     * @template T - 被代理变量的类型
     */
    type Ref<T> = T extends object ? ObjectProxy<T> : PlainProxy<T>
    /**
     * 普通类型变量，如字符串、数字、布尔等。
     *
     * 需要使用`.value`访问和修改。
     */
    type PlainProxy<T> = { value: T; [IS_PLAIN_PROXY_SYMBOL]: true; [IS_PROXY_SYMBOL]: true }
    /**
     * 对象响应式变量代理，如对象、数组等。
     *
     * 直接访问和修改。
     */
    type ObjectProxy<T extends object> = T & { [IS_PROXY_SYMBOL]: true }
  }
}
