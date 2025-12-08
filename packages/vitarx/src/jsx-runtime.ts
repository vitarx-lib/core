import {
  type AnyProps,
  type CreatableType,
  createVNode,
  Fragment,
  type UniqueKey,
  type VNodeOf
} from '@vitarx/runtime-core'

/**
 * JSX构建VNode
 *
 * @see createVNode
 */
function jsx<T extends CreatableType>(
  type: T,
  props: AnyProps | null = null,
  key?: UniqueKey
): VNodeOf<T> {
  if (key) {
    if (!props) {
      props = { key } as any
    } else {
      props.key = key
    }
  }
  return createVNode(type, props as any) as VNodeOf<T>
}

export { jsx, Fragment, jsx as jsxs }
