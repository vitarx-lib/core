import {
  createElement,
  Fragment,
  type VNode,
  type VNodeProps,
  type VNodeType
} from './core/index.js'

type Source = { fileName: string; lineNumber: number }

/**
 * JSX构建VNode
 *
 * @see createElement
 */
function jsx<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null = null,
  key?: Vitarx.GlobalIntrinsicAttributes['key']
): VNode<T> {
  if (key) {
    if (!props) {
      // @ts-ignore
      props = { key }
    } else {
      props.key = key
    }
  }
  return createElement(type, props)
}

/**
 * JSX构建VNode(开发模式)
 *
 * @param type
 * @param props
 * @param key
 * @param isStatic
 * @param source
 * @param self
 */
function jsxDEV<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null,
  key: Vitarx.GlobalIntrinsicAttributes['key'] | null,
  isStatic: boolean,
  source: Source,
  self: any
): VNode<T> {
  return createElement(type, props, key)
}

export { Fragment, jsx, jsx as jsxs, jsxDEV }
