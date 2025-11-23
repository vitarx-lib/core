import {
  type CodeSourceInfo,
  setNodeDevInfo,
  type UniqueKey,
  type ValidNodeProps,
  type ValidNodeType,
  type VNodeInstanceType
} from '@vitarx/runtime-core'
import type { AnyRecord } from '@vitarx/utils'
import { jsx } from './jsx-runtime.js'

export { Fragment } from './jsx-runtime.js'

/**
 * JSX构建VNode(开发模式)
 *
 * @param type - 类型
 * @param props - 属性
 * @param key - 唯一标识
 * @param isStatic - 是否静态
 * @param source - 源码位置信息
 * @param self - 组件实例
 */
export function jsxDEV<T extends ValidNodeType>(
  type: T,
  props: ValidNodeProps<T> | null,
  key: UniqueKey | undefined,
  isStatic: boolean,
  source: CodeSourceInfo,
  self: any
): VNodeInstanceType<T> {
  if (typeof type === 'function' && typeof window !== 'undefined') {
    // 获取最新模块
    const newModule = (window as any).__$VITARX_HMR$__?.replaceNewModule?.(type)
    if (newModule) type = newModule
  }
  const vnode = jsx(type, props, key)
  setNodeDevInfo(props as AnyRecord, {
    source,
    isStatic,
    self
  })
  return vnode
}
