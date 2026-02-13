import {
  type CodeLocation,
  createView,
  type ValidProps,
  type ViewOf,
  type ViewTag
} from '@vitarx/runtime-core'

export { Fragment } from './jsx-runtime.js'

/**
 * JSX构建View(开发模式)
 *
 * @param type - 类型
 * @param props - 属性
 * @param location - 代码位置
 * @returns { View } - 视图对象
 */
export function jsxDEV<T extends ViewTag>(
  type: T,
  props: ValidProps<T> | null = null,
  location: CodeLocation
): ViewOf<T> {
  if (typeof type === 'function' && typeof window !== 'undefined') {
    // 获取最新模块
    const newModule = (window as any).__$VITARX_HMR$__?.replaceNewModule?.(type)
    if (newModule) type = newModule
  }
  return createView(type, props, location) as ViewOf<T>
}
