import {
  createVNode,
  Fragment,
  type UniqueKey,
  type ValidNodeProps,
  type ValidNodeType,
  type VNodeInstanceType
} from '@vitarx/runtime-core'

/**
 * JSX构建VNode
 *
 * @see createVNode
 */
function jsx<T extends ValidNodeType>(
  type: T,
  props: ValidNodeProps<T> | null = null,
  key?: UniqueKey
): VNodeInstanceType<T> {
  if (key) {
    if (!props) {
      props = { key } as any
    } else {
      props.key = key
    }
  }
  return createVNode(type, props || ({} as ValidNodeProps<T>)) as VNodeInstanceType<T>
}

export { jsx, Fragment, jsx as jsxs }
