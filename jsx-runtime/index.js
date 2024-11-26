import { createElement, Fragment } from './../dist/index.js'

/**
 * JSX构建VNode
 *
 * @see createElement
 */
function jsx(type, props, key) {
  if (key) {
    if (!props) {
      props = { key }
    } else {
      props.key = key
    }
  }
  return createElement(type, props)
}

export { Fragment, jsx, jsx as jsxs }
