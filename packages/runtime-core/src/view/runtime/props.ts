import { isRef, Ref, unref } from '@vitarx/responsive'
import { hasOwnProperty, isObject, isRecordObject, popProperty } from '@vitarx/utils'
import { INTRINSIC_ATTRIBUTES } from '../../constants/index.js'
import type { AnyProps, BindAttributes } from '../../types/index.js'
import { StyleUtils } from '../../utils/index.js'

const SPECIAL_MERGERS = {
  style: StyleUtils.mergeCssStyle,
  class: StyleUtils.mergeCssClass,
  className: StyleUtils.mergeCssClass
} as const

/**
 * 处理 v-bind 属性绑定，将绑定对象的属性合并到目标 props 中
 *
 * 支持两种绑定形式：
 * 1. 普通对象形式：v-bind="sourceObj"
 * 2. 数组形式：v-bind="[sourceObj, excludeKeys]" - 指定需要排除的属性列表
 *
 * @param props 目标 props 对象，将合并绑定属性到此对象
 * @param bind 绑定属性源，可以是对象或数组形式
 * @returns {AnyProps} - 融合后的新 props 对象
 */
export function bindProps(props: AnyProps, bind: BindAttributes): AnyProps {
  let binding: AnyProps
  let exclude: Set<string> | null = null

  // ---------- 解析 binding ----------
  if (Array.isArray(bind)) {
    const [src, ex] = bind as [AnyProps, string[]]
    if (!isRecordObject(src)) return props
    binding = src
    if (Array.isArray(ex) && ex.length) {
      exclude = new Set(ex)
    }
  } else {
    if (!isRecordObject(bind)) return props
    binding = bind
  }

  const result: AnyProps = {}

  // ---------- 收集所有 keys ----------
  const keys = new Set<string>()

  for (const key in binding) {
    if (INTRINSIC_ATTRIBUTES.has(key) || exclude?.has(key)) continue
    keys.add(key)
  }

  for (const key in props) {
    keys.add(key)
  }

  // ---------- 定义 getter ----------
  for (const key of keys) {
    const inProps = hasOwnProperty(props, key)
    const inBinding = hasOwnProperty(binding, key)

    // ---- class / style 合并 ----
    if (key in SPECIAL_MERGERS && inProps && inBinding) {
      const merger = SPECIAL_MERGERS[key as keyof typeof SPECIAL_MERGERS]
      Object.defineProperty(result, key, {
        enumerable: true,
        get() {
          return merger(unref(binding[key]), unref(props[key]))
        }
      })
      continue
    }

    // ---- props 优先 ----
    if (inProps) {
      Object.defineProperty(result, key, {
        enumerable: true,
        get() {
          return props[key]
        }
      })
      continue
    }

    // ---- binding 注入 ----
    if (inBinding) {
      Object.defineProperty(result, key, {
        enumerable: true,
        get() {
          return unref(binding[key])
        }
      })
    }
  }

  return result
}

type ResolvedResult<T extends AnyProps> = {
  ref?: Ref
  props: T | null
}
export function resolveProps<T extends AnyProps>(props: T | null): ResolvedResult<T> {
  let ref: Ref | null = null
  let resolvedProps: T | null = null
  if (props) {
    ref = popProperty(props, 'ref')
    const binding = popProperty(props, 'v-bind')
    resolvedProps = isObject(binding) ? (bindProps(props, binding) as T) : props
  }
  const result: ResolvedResult<T> = { props: resolvedProps }
  if (isRef(ref)) result.ref = ref
  return result
}
