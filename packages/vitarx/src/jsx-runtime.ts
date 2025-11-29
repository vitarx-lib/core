import {
  type AllowCreatedNodeType,
  createVNode,
  Fragment,
  type UniqueKey,
  type VNodeInputProps,
  type VNodeInstanceType
} from '@vitarx/runtime-core'

/**
 * JSX构建VNode
 *
 * @see createVNode
 */
function jsx<T extends AllowCreatedNodeType>(
  type: T,
  props: VNodeInputProps<T> | null = null,
  key?: UniqueKey
): VNodeInstanceType<T> {
  if (key) {
    if (!props) {
      props = { key } as any
    } else {
      props.key = key
    }
  }
  return createVNode(type, props || ({} as VNodeInputProps<T>)) as VNodeInstanceType<T>
}

export { jsx, Fragment, jsx as jsxs }
