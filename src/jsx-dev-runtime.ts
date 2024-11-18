import { Fragment, type VNode, type VNodeProps, type VNodeType } from './core/index.js'
import { jsx } from './jsx-runtime.js'

type Source = { fileName: string; lineNumber: number; columnNumber: number }

interface DevVNode<T extends VNodeType> extends VNode<T> {
  devInfo: {
    source: Source
    isStatic: boolean
    self: any
  }
}
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
function jsxDEV<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null,
  key: Vitarx.GlobalIntrinsicAttributes['key'] | undefined,
  isStatic: boolean,
  source: Source,
  self: any
): DevVNode<T> {
  // @ts-ignore 开发模式获取新模块
  if (import.meta.env?.MODE === 'development') {
    if (typeof type === 'function') {
      // @ts-ignore
      const newModule = window['__$vitarx_widget_hmr_map$__']?.get?.(type)
      if (newModule) type = newModule
    }
  }
  const vnode = jsx(type, props, key) as DevVNode<T>
  vnode.devInfo = {
    source,
    isStatic,
    self
  }
  return vnode
}

export { Fragment, jsxDEV }
