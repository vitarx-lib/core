import { isRef, unref } from '@vitarx/responsive'
import { hasOwnProperty, isFunction, isObject, isRecordObject, popProperty } from '@vitarx/utils'
import { INTRINSIC_ATTRIBUTES } from '../../constants/index.js'
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
import { TextView } from '../view/atomic.js'
import { SwitchView } from '../view/switch.js'

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
  const result: ResolvePropsResult<T> = { props: resolvedProps }
  // 如果存在ref，则将其添加到结果中
  if (isRef(ref) || isFunction(ref)) result.ref = ref
  return result
}

/**
 * 解析并扁平化子节点数组
 *
 * 该函数使用迭代而非递归的方式处理嵌套的子节点数组，
 * 避免了深度嵌套时可能导致的栈溢出问题。
 *
 * 主要处理流程：
 * 1. 使用栈结构进行迭代处理，扁平化嵌套数组
 * 2. 非Block的child转换为动态/文本块
 * 3. 建立子节点与父节点的关联
 *
 * @param children 子节点或子节点列表，可以是单个值、数组或嵌套数组
 * @returns {ResolvedChildren} 解析后的子节点数组
 */
export function resolveChildren(children: ValidChildren): ResolvedChildren {
  const childList: View[] = []
  if (children == null) return childList
  // 使用单个栈来处理嵌套结构，避免多次创建数组
  const stack: Array<unknown> = Array.isArray(children) ? [...children] : [children]
  while (stack.length > 0) {
    const current = stack.pop()!

    // 处理数组情况：直接展开并按正确顺序推入栈
    if (Array.isArray(current)) {
      // 按原顺序逆向推入栈，这样弹出时就是正确的顺序
      for (let i = current.length - 1; i >= 0; i--) {
        stack.push(current[i])
      }
      continue
    }

    // 直接处理当前项，避免重复的类型检查
    if (current == null) continue

    // 直接进行类型判断，减少函数调用开销
    if (isView(current)) {
      childList.push(current)
    } else if (isRef(current)) {
      childList.push(new SwitchView(current))
    } else {
      const str = String(current)
      if (str.length) childList.push(new TextView(str))
    }
  }

  return childList
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
  if (!isRecordObject(defaultProps)) return props
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
