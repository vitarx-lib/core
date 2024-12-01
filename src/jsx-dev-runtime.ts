import { Fragment, jsx } from './jsx-runtime.js'
import type { VNode, VNodeProps, VNodeType } from './core/index.js'

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
  if (typeof type === 'function') {
    // 获取最新模块
    let newModule = (window as any)?.__$vitarx_widget_hmr_map$__?.get?.(type)
    while (newModule) {
      type = newModule
      newModule = (window as any)?.__$vitarx_widget_hmr_map$__?.get?.(newModule)
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
