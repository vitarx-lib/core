import { isRef, unref } from '@vitarx/responsive'
import { hasOwnProperty, isFunction, isObject, isPlainObject, popProperty } from '@vitarx/utils'
import { INTRINSIC_ATTRIBUTES } from '../../constants/attributes.js'
import { StyleUtils } from '../../shared/index.js'
import { isView } from '../../shared/utils/is.js'
import type {
  AnyProps,
  BindAttributes,
  InstanceRef,
  ResolvedChildren,
  ValidChildren,
  View
} from '../../types/index.js'
import { CommentView, TextView } from '../implements/atomic.js'
import { DynamicView } from '../implements/dynamic.js'

type ResolvePropsResult<T extends AnyProps> = {
  ref?: InstanceRef
  props: T | null
}

export const SPECIAL_PROP_MERGERS = {
  style: StyleUtils.mergeCssStyle,
  class: StyleUtils.mergeCssClass,
  className: StyleUtils.mergeCssClass,
  classname: StyleUtils.mergeCssClass
} as const

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

  // ---------- 解析 binding ----------
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

  // ---------- 收集所有 keys ----------
  const keys = new Set<string>()

  for (const key in binding) {
    if (INTRINSIC_ATTRIBUTES.has(key) || key.startsWith('v-') || exclude?.has(key)) continue
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
    if (key in SPECIAL_PROP_MERGERS && inProps && inBinding) {
      const merger = SPECIAL_PROP_MERGERS[key as keyof typeof SPECIAL_PROP_MERGERS]
      Object.defineProperty(result, key, {
        enumerable: true,
        get() {
          return merger(unref(props[key]), unref(binding[key]))
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

/**
 * 解析组件的props属性
 *
 * @template T - 泛型参数，继承自AnyProps类型
 * @param props 传入的props对象，可能为null
 * @return {ResolvePropsResult<T>} 返回一个对象，包含可选的ref属性和解析后的props
 */
export function resolveProps<T extends AnyProps>(props: T | null): ResolvePropsResult<T> {
  // 如果props不存在，直接返回null
  if (!props) return { props: null }
  // 从props中提取ref属性
  const ref = popProperty(props, 'ref')
  // 从props中提取v-bind属性
  const binding = popProperty(props, 'v-bind')
  // 如果存在v-bind绑定，则进行props绑定处理
  const resolvedProps = isObject(binding) ? (bindProps(props, binding) as T) : props
  // 构建返回结果对象
  const result: ResolvePropsResult<T> = {
    props: __VITARX_DEV__ ? Object.freeze(resolvedProps) : resolvedProps
  }
  // 如果存在ref，则将其添加到结果中
  if (isRef(ref) || isFunction(ref)) result.ref = ref
  return result
}
/**
 * 检查给定的值是否是有效的子元素
 * @param value - 需要检查的值，可以是任何类型
 * @returns {boolean} 返回一个布尔值，表示值是否是有效的子元素
 *          如果值是字符串、数字、视图、数组或引用，则返回true
 */
export function isValidChild(value: any): value is ValidChildren {
  const type = typeof value
  return (
    type === 'string' || type === 'number' || isView(value) || Array.isArray(value) || isRef(value)
  )
}
/**
 * 解析子元素并转换为适当的视图类型
 *
 * @param child - 需要解析的子元素，可以是任意类型
 * @returns 返回对应的视图对象，如果无法处理则返回 null
 */
export function resolveChild(child: unknown): null | View {
  // 处理 View 对象 - 直接返回，避免不必要的包装
  if (isView(child)) return child
  // 处理 Ref 对象 - 包装为 DynamicView
  if (isRef(child)) return new DynamicView(child)
  const type = typeof child
  // 处理字符串和数字类型
  if (type === 'string' || type === 'number') {
    const text = String(child)
    // 处理空字符串情况 - 返回注释视图
    return text.length === 0 ? new CommentView('empty:string') : new TextView(text)
  }
  // 处理其他类型 - 返回 null
  return null
}

/**
 * 解析并扁平化子节点数组
 *
 * 该函数使用迭代而非递归的方式处理嵌套的子节点数组，
 * 避免了深度嵌套时可能导致的栈溢出问题。
 *
 * 主要处理流程：
 * 1. 使用栈结构进行迭代处理，扁平化嵌套数组
 * 2. 非View的child转换为动态/文本视图
 * 3. 建立子节点与父节点的关联
 *
 * @param children 子节点或子节点列表，可以是单个值、数组或嵌套数组
 * @returns {ResolvedChildren} 解析后的子节点数组
 */
export function resolveChildren(children: ValidChildren): ResolvedChildren {
  const childList: View[] = []
  if (children == null) return childList

  // 使用 ValidChildren 类型替代 unknown，提高类型安全性
  const stack: ValidChildren[] = []

  // 辅助函数：将数组逆序推入栈
  const pushArrayToStack = (arr: ValidChildren[]) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      stack.push(arr[i])
    }
  }

  // 初始化栈
  if (Array.isArray(children)) {
    pushArrayToStack(children)
  } else {
    stack.push(children)
  }

  while (stack.length > 0) {
    const current = stack.pop()!

    // 处理数组情况：展开并推入栈
    if (Array.isArray(current)) {
      pushArrayToStack(current)
      continue
    }
    const view = resolveChild(current)
    if (view) childList.push(view)
  }

  return __VITARX_DEV__ ? Object.freeze(childList) : childList
}

/**
 * 应用引用（ref）到指定元素
 * @param ref - 引用对象，可以是函数或对象
 * @param el - 要应用引用的元素
 */
export function applyRef(ref: InstanceRef, el: unknown) {
  // 如果引用不存在，则直接返回
  if (!ref) return
  // 判断引用是否为函数类型
  if (typeof ref === 'function') {
    // 如果是函数，则调用函数并传入元素
    ref(el)
  } else {
    // 如果是对象，则将元素的值赋给引用对象的value属性
    ref.value = el
  }
}

/**
 * 合并默认属性和传入属性，创建一个新的属性对象
 * 当传入属性不存在时使用默认属性，当默认属性不存在时返回空对象
 *
 * @param props 传入的属性对象，可能为null
 * @param defaultProps 默认属性对象，可能为undefined
 * @returns {AnyProps} 合并后的新属性对象
 */
export function mergeDefaultProps(
  props: AnyProps | null,
  defaultProps: AnyProps | undefined
): AnyProps {
  // 如果没有传入props，返回defaultProps（如果存在）或空对象
  if (!props) return defaultProps ?? defaultProps ?? {}
  // 如果defaultProps不是对象类型，直接返回props
  if (!isPlainObject(defaultProps)) return props
  // 创建一个结果对象
  const result: Record<string, any> = {}
  // 创建一个Set来收集所有属性键
  const keys = new Set<string>()
  // 将defaultProps的所有键添加到Set中
  for (const key in defaultProps) keys.add(key)
  // 将props的所有键添加到Set中
  for (const key in props) keys.add(key)
  // 遍历所有唯一的键
  for (const key of keys) {
    // 使用属性描述符定义每个属性
    Object.defineProperty(result, key, {
      enumerable: true, // 属性可枚举
      configurable: true, // 属性可配置
      get() {
        // 使用getter函数实现属性值的获取逻辑
        // 如果props中存在该属性，返回props的值
        if (props[key] != null) {
          return props[key]
        }
        // 否则返回defaultProps中的值
        return defaultProps[key]
      }
    })
  }
  // 返回合并后的结果对象
  return result
}
