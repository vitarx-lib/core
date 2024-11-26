import { Fragment, jsx } from './../jsx-runtime/index.js'

/**
 * JSX构建VNode(开发模式)
 *
 * @param type - 类型
 * @param props - 属性
 * @param key - 唯一标识
 * @param isStatic - 是否静态
 * @param source - 源码位置信息
 * @param self - 绑定的this
 */
function jsxDEV(type, props, key, isStatic, source, self) {
  // 开发模式获取新模块
  if (import.meta.env?.MODE === 'development') {
    if (typeof type === 'function') {
      const newModule = window['__$vitarx_widget_hmr_map$__']?.get?.(type)
      if (newModule) type = newModule
    }
  }
  const vnode = jsx(type, props, key)
  vnode.devInfo = {
    source,
    isStatic,
    self
  }
  return vnode
}

export { Fragment, jsxDEV }
