import {
  createElement,
  Fragment,
  type VNode,
  type VNodeProps,
  type VNodeType
} from './core/index.js'

type Source = { fileName: string; lineNumber: number; columnNumber: number }

/**
 * JSX构建VNode(开发模式)
 *
 * @param type
 * @param props
 * @param key
 * @param _isStatic
 * @param _source
 * @param _self
 */
function jsxDEV<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null,
  key: Vitarx.GlobalIntrinsicAttributes['key'] | undefined,
  _isStatic: boolean,
  _source: Source,
  _self: any
): VNode<T> {
  return createElement(type, props, key)
}

export { Fragment, jsxDEV }
