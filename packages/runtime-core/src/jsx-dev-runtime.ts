import { jsx } from './jsx-runtime.js'
import { type Source, type UniqueKey, VNode, type VNodeProps, type VNodeType } from './vnode'

export { Fragment } from './jsx-runtime.js'

/**
 * JSX构建VNode(开发模式)
 *
 * @param type - 类型
 * @param props - 属性
 * @param key - 唯一标识
 * @param _isStatic - 是否静态
 * @param source - 源码位置信息
 * @param _self - 组件实例
 */
export function jsxDEV<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null,
  key: UniqueKey | undefined,
  _isStatic: boolean,
  source: Source,
  _self: any
): VNode<T> {
  if (typeof type === 'function' && typeof window !== 'undefined') {
    // 获取最新模块
    const newModule = (window as any).__$VITARX_HMR$__?.replaceNewModule?.(type)
    if (newModule) type = newModule
  }
  const vnode = jsx(type, props, key)
  vnode.source = source
  return vnode
}
