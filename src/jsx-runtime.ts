import {
  createElement,
  Fragment,
  type VNode,
  type VNodeProps,
  type VNodeType
} from './core/index.js'


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


export { Fragment, jsx, jsx as jsxs }
