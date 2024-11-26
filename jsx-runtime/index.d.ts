import { Fragment, type VNode, type VNodeProps, type VNodeType } from 'vitarx'

/**
 * JSX构建VNode
 *
 * @see createElement
 */
declare function jsx<T extends VNodeType>(
  type: T,
  props?: VNodeProps<T> | null,
  key?: Vitarx.GlobalIntrinsicAttributes['key']
): VNode<T>

export { Fragment, jsx, jsx as jsxs }
