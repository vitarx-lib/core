import {
  createView,
  Fragment,
  type ValidProps,
  type ViewOf,
  type ViewTag
} from '@vitarx/runtime-core'

/**
 * JSX构建VNode
 *
 * @see createVNode
 */
function jsx<T extends ViewTag>(type: T, props: ValidProps<T> | null = null): ViewOf<T> {
  return createView(type, props) as ViewOf<T>
}

export { jsx, Fragment, jsx as jsxs }
