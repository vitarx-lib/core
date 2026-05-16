import { isRef, unref } from '@vitarx/responsive'
import { isFunction, isPlainObject, popProperty } from '@vitarx/utils'
import { INTRINSIC_ATTRIBUTES } from '../../constants/attributes.js'
import type { AnyProps, BindAttributes, InstanceRef } from '../../types/index.js'
import { StyleUtils } from '../../utils/style.js'

type ResolvePropsResult<T extends AnyProps> = {
  ref?: InstanceRef
  props: T | null
}

const hasValidProp = (obj: AnyProps, key: string): boolean => key in obj && obj[key] !== undefined

/**
 * 处理 v-bind 属性绑定，将绑定对象的属性合并到目标 props 中
 *
 * 支持两种绑定形式：
 * 1. 普通对象形式：`v-bind={sourceObj}`
 * 2. 数组形式：`v-bind={[sourceObj, excludeKeys]}` - 指定需要排除的属性列表
 *
 * @param props 目标 props 对象，将合并绑定属性到此对象
 * @param bind 绑定属性源，可以是对象或数组形式
 * @returns {AnyProps} - 融合后的新 props 对象
 */
export function bindProps(props: AnyProps, bind: BindAttributes): AnyProps {
  let binding: AnyProps
  let exclude: Set<string> | null = null

  if (Array.isArray(bind)) {
    const [src, ex] = bind as [AnyProps, string[]]
    if (!isPlainObject(src)) return props
    binding = src
    if (Array.isArray(ex) && ex.length) {
      exclude = new Set(ex)
    }
  } else {
    if (!isPlainObject(bind)) return props
    binding = bind
  }

  const result: AnyProps = {}

  const keys = new Set<string>()

  for (const key in binding) {
    if (INTRINSIC_ATTRIBUTES.has(key) || key.startsWith('v-') || exclude?.has(key)) continue
    keys.add(key)
  }

  for (const key in props) {
    keys.add(key)
  }

  for (const key of keys) {
    Object.defineProperty(result, key, {
      enumerable: true,
      get() {
        if (key === 'style') {
          return StyleUtils.mergeCssStyle(props[key], unref(binding[key]))
        }
        if (key === 'class') {
          return StyleUtils.mergeCssClass(props[key], unref(binding[key]))
        }
        if (hasValidProp(props, key)) {
          return props[key]
        }
        return unref(binding[key])
      }
    })
  }

  return result
}

/**
 * 解析并处理v-bind属性
 *
 * @param props - 输入的属性对象
 * @returns {AnyProps} 返回处理后的属性对象
 */
export function resolveBind<T extends AnyProps>(props: T): T {
  const binding = popProperty(props, 'v-bind')
  if (!binding) return props
  return isPlainObject(binding) || Array.isArray(binding) ? (bindProps(props, binding) as T) : props
}

/**
 * 解析组件的props属性
 *
 * @template T - 泛型参数，继承自AnyProps类型
 * @param props 传入的props对象，可能为null
 * @return {ResolvePropsResult<T>} 返回一个对象，包含可选的ref属性和解析后的props
 */
export function resolveProps<T extends AnyProps>(props: T | null): ResolvePropsResult<T> {
  if (!props) return { props: null }
  const ref = popProperty(props, 'ref')
  const resolvedProps = resolveBind(props)
  const result: ResolvePropsResult<T> = {
    props: resolvedProps
  }
  if (isRef(ref) || isFunction(ref)) result.ref = ref
  return result
}

/**
 * 合并Props对象
 *
 * 合并两个Props对象，如果对象2中存在与对象1相同的属性，则对象2的属性值优先。
 *
 * @param p1 - 对象1
 * @param p2 - 对象2
 * @returns {AnyProps} 合并后的新属性对象
 */
export function mergeProps(p1: AnyProps, p2: AnyProps): AnyProps {
  if (__VITARX_DEV__) {
    if (!isPlainObject(p1) || !isPlainObject(p2)) {
      throw new Error('[vitarx] mergeProps() Invalid props or defaultProps')
    }
  }
  const result: Record<string, any> = {}
  const keys = new Set<string>()
  for (const key in p2) keys.add(key)
  for (const key in p1) keys.add(key)
  for (const key of keys) {
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: true,
      get() {
        if (hasValidProp(p2, key)) {
          return p2[key]
        }
        return p1[key]
      }
    })
  }
  return result
}
