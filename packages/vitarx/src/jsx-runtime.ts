import {
  type CreatableType,
  createVNode,
  Fragment,
  type UniqueKey,
  type VNodeInputProps,
  type VNodeOf
} from '@vitarx/runtime-core'

/**
 * JSX构建VNode
 *
 * @see createVNode
 */
function jsx<T extends CreatableType>(
  type: T,
  props: VNodeInputProps<T> | null = null,
  key?: UniqueKey
): VNodeOf<T> {
  if (key) {
    if (!props) {
      props = { key } as any
    } else {
      props.key = key
    }
  }
  return createVNode(type, props || ({} as VNodeInputProps<T>)) as VNodeOf<T>
}

export { jsx, Fragment, jsx as jsxs }
