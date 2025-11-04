import { unref } from '@vitarx/responsive'
import { isObject, isRecordObject, logger, popProperty } from '@vitarx/utils'
import type {
  AnyProps,
  ClassAttribute,
  RuntimeVNodeChildren,
  StyleRules,
  UniqueKey,
  VNodeChild,
  VNodeChildren
} from '../../types/index.js'
import { VNode } from '../base/index.js'
import { INTRINSIC_ATTRIBUTES } from '../constants/index.js'
import { CommentNode, TextNode } from '../nodes/index.js'
import { linkParentNode } from '../runtime/index.js'
import { __DEV__ } from './dev.js'
import { isVNode } from './is.js'
import { StyleUtils } from './style.js'
// 用于定义特定属性的自定义合并逻辑
const SPECIAL_MERGERS = {
  style: StyleUtils.mergeCssStyle,
  class: StyleUtils.mergeCssClass,
  className: StyleUtils.mergeCssClass,
  classname: StyleUtils.mergeCssClass
} as const

/**
 * 解包ref属性函数
 * 该函数会遍历传入的对象的所有属性，并将每个属性通过unref函数进行解包
 * @param props - 需要解包的属性对象，类型为AnyProps
 * @returns {object} 解包后的属性对象
 */
export const unwrapRefProps = <T extends AnyProps>(props: T): T => {
  // 检查props对象是否包含属性
  if (Object.keys(props).length) {
    // 解包ref
    for (const prop in props) {
      props[prop] = unref(props[prop])
    }
  }
  return props
}
/**
 * 处理 v-bind 属性绑定，将绑定对象中的属性合并到组件 props 上。
 *
 * 支持以下特性：
 * - 处理对象形式或数组形式的 v-bind（如：`v-bind="obj"` 或 `v-bind="[obj, ['excludeKey']]`）
 * - 支持排除列表 exclude，用于指定不希望被绑定的属性
 * - 针对特殊属性（如 class 与 style）执行智能合并
 *
 * @template T - props 对象的类型
 * @param props - 原始属性对象，会被直接修改
 *
 * @example
 * ```ts
 * const props = { id: 'btn', class: 'primary', 'v-bind': [{ color: 'red', style: { fontSize: '14px' } }] }
 * handleBindProps(props)
 * // props 结果: { id: 'btn', class: 'primary', color: 'red', style: { fontSize: '14px' } }
 * ```
 */
export const handleBindProps = <T extends AnyProps>(props: T): void => {
  // ---------- Step 1: 取出并验证 v-bind ----------
  const bind = popProperty(props, 'v-bind')
  if (!isObject(bind)) return // 非对象或 null/undefined 直接退出

  // ---------- Step 2: 解析绑定源与排除列表 ----------
  let source: AnyProps
  let exclude: Set<string> | null = null

  if (Array.isArray(bind)) {
    // v-bind 是数组形式： [源对象, 排除数组]
    const [src, ex] = bind as [props: AnyProps, exclude: string[]]
    if (!isRecordObject(src)) return
    source = src
    if (Array.isArray(ex) && ex.length) exclude = new Set(ex)
  } else {
    // 普通对象形式
    source = bind
  }

  // ---------- Step 3: 遍历并合并属性 ----------
  for (const [key, rawValue] of Object.entries(source)) {
    // ---- 跳过无效属性 ----
    if (
      rawValue === undefined || // 忽略 undefined 值
      INTRINSIC_ATTRIBUTES.has(key) || // 忽略固有属性（如 key/ref 等）
      (exclude && exclude.has(key)) // 忽略用户指定排除属性
    ) {
      continue
    }

    const existing = props[key] // 当前 props 中已有的值
    const value = unref(rawValue) // 解包可能的 ref/reactive 值

    // ---- 特殊属性处理（class/style）----
    if (key in SPECIAL_MERGERS) {
      const merger = SPECIAL_MERGERS[key as keyof typeof SPECIAL_MERGERS]
      props[key as keyof T] = existing
        ? merger(unref(existing), value) // 合并已有与新值
        : value // 无现值则直接使用新值
      continue
    }

    // ---- 已存在的普通属性保持不变 ----
    if (existing !== undefined) continue

    // ---- 新增普通属性 ----
    props[key as keyof T] = value
  }
}

/**
 * 标准化样式属性
 * 该函数用于处理传入的props中的style和class属性，将其转换为统一的格式
 * @param props 包含任意属性的输入对象
 * @returns {object} 返回处理后的标准化属性对象
 */
export const normalizeStyle = <T extends AnyProps>(props: T): T => {
  // 处理 style 属性
  if ('style' in props) {
    // 将样式值转换为对象格式
    ;(props as unknown as Record<'style', StyleRules>).style = StyleUtils.cssStyleValueToObject(
      props.style
    )
  }
  // 处理 class 属性
  let cssClass: ClassAttribute =
    'class' in props ? StyleUtils.cssClassValueToArray(props.class as ClassAttribute) : []
  if ('className' in props) {
    // 合并class和className属性
    cssClass = StyleUtils.mergeCssClass(cssClass, props.className as ClassAttribute)
    // @ts-ignore - 删除className属性，因为已经合并到class中
    delete this.props.className
  }
  // 如果合并后的 class 存在，赋值给 newProps.class
  if (cssClass.length > 0) (props as unknown as Record<'class', string[]>).class = cssClass
  return props
}

/**
 * 将单个节点转换为 VNode
 */
const normalizeChild = (current: unknown, keySet: Set<UniqueKey>): VNode | undefined => {
  if (current == null || typeof current === 'boolean') {
    return __DEV__ ? new CommentNode({ value: String(current) }) : undefined
  }
  if (isVNode(current)) {
    checkDuplicateKey(current, keySet)
    return current
  }
  return new TextNode({ value: String(current) })
}
/**
 * 检查 VNode 的 key 是否重复
 */
const checkDuplicateKey = (vnode: VNode, keySet: Set<UniqueKey>): void => {
  if (vnode.key == null) return
  if (keySet.has(vnode.key)) {
    logger.warn(
      `Duplicate key ${String(vnode.key)} detected, which can cause rendering errors or performance issues`,
      vnode.devInfo?.source
    )
  } else {
    keySet.add(vnode.key)
  }
}
/**
 * 扁平化并标准化子节点 (迭代优化版)
 *
 * @param children - 子节点/子节点列表
 * @param parent - 父节点
 * @param handler - 额外处理函数
 * @returns {VNode[]} 返回一个包含所有子节点的数组
 */
export const normalizeChildren = (
  children: VNodeChild | VNodeChildren,
  parent: VNode,
  handler?: (node: VNode) => void
): RuntimeVNodeChildren => {
  const keySet = new Set<UniqueKey>()
  const childList: VNode[] = []
  const stack: Array<VNodeChild | VNodeChildren> = [unref(children)]

  while (stack.length > 0) {
    const current = unref(stack.pop()!)
    if (Array.isArray(current)) {
      // 逆序压栈以保持顺序
      for (let i = current.length - 1; i >= 0; i--) {
        stack.push(unref(current[i]))
      }
    } else {
      const childNode = normalizeChild(current, keySet)
      if (childNode) {
        linkParentNode(childNode, parent)
        handler?.(childNode)
        childList.push(childNode)
      }
    }
  }

  return childList
}
