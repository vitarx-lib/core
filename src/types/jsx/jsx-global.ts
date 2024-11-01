import { HtmlIntrinsicElements } from './html-elements'

declare global {
  namespace JSX {
    /**
     * @inheritDoc
     */
    interface IntrinsicElements extends HtmlIntrinsicElements {}

    /**
     * @inheritDoc
     */
    interface IntrinsicAttributes extends Vitarx.IntrinsicAttributes {}

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
