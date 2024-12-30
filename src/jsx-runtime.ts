import {
  createElement,
  Fragment,
  type VNode,
  type VNodePropsType,
  type VNodeType
} from './core/index.js'

/**
 * JSX构建VNode
 *
 * @see createElement
 */
function jsx<T extends VNodeType>(
  type: T,
  props: VNodePropsType<T> | null = null,
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

export { jsx, Fragment, jsx as jsxs }
