import { HtmlIntrinsicElements } from './html-elements'
import { Widget } from '../core/index.js'

declare global {
  /** 任意函数 */
  type AnyFunction = (...args: any[]) => any
  /** 任意回调函数 */
  type AnyCallback = AnyFunction
  /** void 回调函数 */
  type VoidCallback = VoidFunction
  /** 任意对象 */
  type AnyRecord = Record<any, any>
  /** 任意数组 */
  type AnyArray = Array<any>
  /** 任意 Map */
  type AnyMap = Map<any, any>
  /** 任意 WeakMap */
  type AnyWeakMap = WeakMap<WeakKey, any>
  /** 任意 WeakSet */
  type AnyWeakSet = WeakSet<WeakKey>
  /** 任意 Set */
  type AnySet = Set<any>
  /** 任意集合对象 */
  type AnyCollection = AnyMap | AnyWeakMap | AnyWeakSet | AnySet
  /** 任意对象类型 函数除外 */
  type AnyObject = AnyRecord | AnyArray | AnyMap | AnySet | AnyWeakMap | AnyWeakSet
  /** 任意原始值类型 */
  type AnyPrimitive = null | undefined | boolean | number | string | bigint | symbol
  /** 深度只读 */
  type DeepReadonly<T> = T extends object
    ? {
        readonly [P in keyof T]: DeepReadonly<T[P]>
      }
    : Readonly<T>
  /** 深度可写 */
  type unDeepReadonly<T> =
    T extends Readonly<object>
      ? {
          [P in keyof T]: unDeepReadonly<T[P]>
        }
      : T
  namespace JSX {
    /** 函数组件返回值 */
    type Element = Widget
    /** 类组件实例 */
    type ElementClass = Widget

    /** 固有元素 */
    interface IntrinsicElements extends HtmlIntrinsicElements {}

    /** 全局固有属性 */
    interface IntrinsicAttributes {
      /**
       * 控制一个 `Widget` 如何替换树中的另一个 `Widget`。
       *
       * 在运行时，如果两个widget的`key`相同，则会更新已渲染的widget，否则会移除旧widget，然后插入新widget。
       *
       * 这在某些情况下很有用，例如，当您想重新排序列表时。
       *
       * 通常，作为另一个 widget 的唯一子项的 widget 不需要显式键。
       */
      key?: string | symbol
    }

    /**
     * 子孙类型检测
     *
     * @see https://bosens-china.github.io/Typescript-manual/download/zh/reference/jsx.html#%E5%AD%90%E5%AD%99%E7%B1%BB%E5%9E%8B%E6%A3%80%E6%9F%A5 子孙类型检测
     */
    interface ElementChildrenAttribute {
      children: {}
    }
  }
}
