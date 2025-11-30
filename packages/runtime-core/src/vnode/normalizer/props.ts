import { unref } from '@vitarx/responsive'
import { isRecordObject } from '@vitarx/utils'
import {
  COMMENT_NODE_TYPE,
  DYNAMIC_RENDER_TYPE,
  FRAGMENT_NODE_TYPE,
  INTRINSIC_ATTRIBUTES,
  TEXT_NODE_TYPE
} from '../../constants/index.js'
import { getRenderer } from '../../renderer/index.js'
import type {
  AllowCreatedNodeType,
  AnyProps,
  BindAttributes,
  ClassProperties,
  StyleRules
} from '../../types/index.js'
import { StyleUtils } from '../../utils/index.js'
// 定义特殊属性的自定义合并逻辑，确保样式和类名正确合并而不是覆盖
const SPECIAL_MERGERS = {
  style: StyleUtils.mergeCssStyle, // 样式对象合并
  class: StyleUtils.mergeCssClass, // 类名数组合并
  className: StyleUtils.mergeCssClass, // 支持大写形式的类名属性
  classname: StyleUtils.mergeCssClass // 支持全小写形式的类名属性
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
 * @returns void - 直接修改传入的 props 对象
 */
export const bindProps = (props: AnyProps, bind: BindAttributes): void => {
  // ---------- Step 1: 解析绑定源和排除列表 ----------
  let source: AnyProps // 绑定属性源对象
  let exclude: Set<string> | null = null // 需要排除的属性集合

  if (Array.isArray(bind)) {
    // v-bind 是数组形式：[源对象, 排除数组]
    // 例如：v-bind="[obj, ['id', 'class']]" - 将 obj 的属性绑定到元素，但排除 id 和 class
    const [src, ex] = bind as [props: AnyProps, exclude: string[]]
    if (!isRecordObject(src)) return // 如果源对象不是普通对象，直接返回
    source = src
    if (Array.isArray(ex) && ex.length) exclude = new Set(ex) // 将排除数组转换为 Set 提高查找效率
  } else {
    // 普通对象形式：v-bind="obj"
    source = bind
  }

  // ---------- Step 2: 遍历源对象属性并合并到目标 props ----------
  for (const [key, rawValue] of Object.entries(source)) {
    // ---- 跳过无效或应排除的属性 ----
    if (
      rawValue === undefined || // 忽略 undefined 值，避免不必要的属性设置
      INTRINSIC_ATTRIBUTES.has(key) || // 忽略框架固有属性（如 key/ref 等），防止覆盖
      (exclude && exclude.has(key)) // 忽略用户指定排除的属性
    ) {
      continue
    }

    const existing = props[key] // 当前 props 中已有的值，用于判断是否需要合并
    const value = unref(rawValue) // 解包可能的 ref/reactive 值，获取实际值

    // ---- 特殊属性处理（class/style）----
    // 对于样式和类名等特殊属性，需要进行智能合并而不是简单覆盖
    if (key in SPECIAL_MERGERS) {
      const merger = SPECIAL_MERGERS[key as keyof typeof SPECIAL_MERGERS]
      props[key] = existing
        ? merger(unref(existing), value) // 合并已有值与新值，保留两者特性
        : value // 如果没有已有值，直接使用新值
      continue
    }
    // ---- 已存在的普通属性保持不变 ----
    // 遵循就近原则，不覆盖已经显式设置的属性
    if (existing !== undefined) continue
    // ---- 新增普通属性 ----
    // 只添加当前 props 中不存在的属性
    props[key] = value
  }
}

/**
 * 初始化元素节点属性，处理属性值的标准化和特殊属性转换
 *
 * 主要功能：
 * 1. 解包所有属性中的 ref/reactive 值
 * 2. 将 style 属性标准化为对象格式
 * 3. 合并 class 和 className 属性，统一使用 class
 *
 * @param props 原始属性对象
 * @returns 处理后的标准化属性对象
 */
export const normalizerStyleAndClassProp = (props: AnyProps): AnyProps => {
  // 步骤2: 处理 style 属性，确保为统一的对象格式
  if ('style' in props) {
    // 将各种形式的样式值（字符串、对象、数组）转换为标准对象格式
    // 例如：将 "color: red; font-size: 16px" 转换为 { color: "red", fontSize: "16px" }
    ;(props as unknown as Record<'style', StyleRules>).style = StyleUtils.cssStyleValueToObject(
      props.style
    )
  }

  // 步骤3: 处理 class 相关属性，统一使用 class 属性名
  // 初始化类名数组，如果已有 class 属性则转换为数组格式
  let cssClass: ClassProperties =
    'class' in props ? StyleUtils.cssClassValueToArray(props.class as ClassProperties) : []

  // 检查并处理 className 属性（React 风格的类名属性）
  if ('className' in props) {
    // 合并 class 和 className 属性，确保两者都生效
    cssClass = StyleUtils.mergeCssClass(cssClass, props.className as ClassProperties)
    // 删除 className 属性，因为已经合并到 class 中，避免重复
    delete props.className
  }

  // 如果合并后的 class 存在，赋值给 props.class，确保为标准数组格式
  if (cssClass.length > 0) (props as unknown as Record<'class', string[]>).class = cssClass
  return props
}

/**
 * 判断是否支持子节点
 *
 * @param type - 节点类型
 * @returns {boolean} 是否支持子节点
 */
export function isSupportChildren(type: AllowCreatedNodeType): boolean {
  if (typeof type === 'string') {
    switch (type) {
      case COMMENT_NODE_TYPE:
      case TEXT_NODE_TYPE:
        return false
      case FRAGMENT_NODE_TYPE:
      case DYNAMIC_RENDER_TYPE:
        return true
      default:
        return !getRenderer().isVoidElement(type)
    }
  }
  return true
}
