import {
  createVNode,
  Fragment,
  type UniqueKey,
  VNode,
  type VNodeProps,
  VNodeType
} from '@vitarx/runtime-core'

/**
 * JSX构建VNode
 *
 * @see createVNode
 */
function jsx<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null = null,
  key?: UniqueKey
): VNode<T> {
  if (key) {
    if (!props) {
      props = { key } as any
    } else {
      props.key = key
    }
  }
  return createVNode(type, props)
}

export { jsx, Fragment, jsx as jsxs }
