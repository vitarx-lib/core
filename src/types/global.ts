import { fragment } from '../index'
import { JSXIntrinsicElements } from './jsx'

declare global {
  namespace Vitarx {
    /**
     * 节点类型
     */
    type ElementType = string | Function | typeof fragment

    /**
     * 节点属性
     *
     * @property {string} key - 节点唯一标识符，用于 diff，列表元素应当具有唯一key
     */
    interface Props {
      key?: string

      [key: string]: any
    }

    /**
     * 用于描述虚拟 DOM 节点
     *
     * @template P - 节点属性类型声明
     * @property {ElementType} type - 节点类型
     * @property {P} props - 节点属性
     * @property {Element[]} children - 子节点列表
     */
    interface Element<P extends Props = Props> {
      type: ElementType
      props: P
      children: Element[]
    }
  }
  namespace JSX {
    /**
     * Element用于描述元素类型、属性、子元素，有以下四种元素类型：
     *
     * 1. `string`：HTML固有元素，固有元素总是以一个小写字母开头，如`div`、`span`等。
     * 2. `Function`：函数声明的小部件，命名规范需以一个大写字母开头。
     * 3. `Class`：类声明小部件，命名规范需以一个大写字母开头，且需继承自`Widget`类。
     * 4. `Fragment`：适配jsx中的`<></>`片段语法。
     */
    export type Element = Vitarx.Element

    type ElementClass = any

    /**
     * @inheritDoc
     */
    interface IntrinsicElements extends JSXIntrinsicElements {}
  }
}
