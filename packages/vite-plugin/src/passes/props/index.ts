/**
 * Props 处理模块入口
 * 负责处理 JSX 元素的属性，包括 v-model 特殊指令
 * @module passes/props
 */
import * as t from '@babel/types'
import { TransformContext } from '../../context.js'
import { processAttribute, processSpreadAttribute } from './attribute.js'
import type { PropsResult, VModelState } from './types.js'
import { createVModelProps, extractVModelState } from './vmodel.js'

// 导出类型定义
export type { PropsResult, VModelState, AttributeResult } from './types.js'

/**
 * 处理 JSX 元素的属性
 * 将 JSX 属性转换为运行时 props 对象，并提取指令
 *
 * 处理流程：
 * 1. 遍历所有属性，分类处理
 * 2. 展开属性转换为 v-bind 格式
 * 3. 普通属性转换为对象属性或 getter
 * 4. 指令属性提取到 directives Map
 * 5. v-model 特殊处理，生成 modelValue 和 onUpdate:modelValue
 *
 * @param node - JSX 元素节点
 * @param ctx - 转换上下文
 * @param hasChildren - 是否有子元素（有子元素时跳过 children 属性）
 * @returns 处理结果，包含 props 对象、指令映射和 v-bind 标记
 *
 * @example
 * ```tsx
 * // 输入
 * <Input v-model={value} placeholder="text" disabled />
 *
 * // 输出 props
 * {
 *   modelValue: get() { return value.value },
 *   'onUpdate:modelValue': v => value.value = v,
 *   placeholder: "text",
 *   disabled: true
 * }
 * ```
 */
export function processProps(
  node: t.JSXElement,
  ctx: TransformContext,
  hasChildren: boolean = false
): PropsResult {
  const attributes = node.openingElement.attributes
  const properties: (t.ObjectProperty | t.ObjectMethod | t.SpreadElement)[] = []
  const directives = new Map<string, t.Expression>()
  let hasVBind = false

  // 追踪已存在的属性名（用于 v-model 冲突检测）
  const existingPropNames = new Set<string>()
  // 提取初始 v-model 状态
  let vModelState: VModelState = extractVModelState(attributes)

  // 遍历处理所有属性
  for (const attr of attributes) {
    // 处理展开属性 {...props}
    if (attr.type === 'JSXSpreadAttribute') {
      const result = processSpreadAttribute(attr, hasVBind, node)
      if (result) {
        properties.push(result.property)
        hasVBind = result.hasVBind
      }
      continue
    }

    // 处理普通属性
    if (attr.type === 'JSXAttribute') {
      // 如果有子元素，跳过 children 属性
      if (hasChildren && attr.name.type === 'JSXIdentifier' && attr.name.name === 'children') {
        continue
      }

      const result = processAttribute(attr, existingPropNames, ctx)
      if (result.type === 'directive') {
        // v-model 指令：更新状态
        if (result.isVModel) {
          vModelState = { hasVModel: true, value: result.value, node: attr }
        }
        // v-bind 指令：添加到属性列表
        else if (result.isVBind) {
          properties.push(t.objectProperty(t.stringLiteral('v-bind'), result.value))
          hasVBind = true
        }
        // 其他指令：添加到指令映射
        else {
          directives.set(result.name, result.value)
        }
      } else if (result.type === 'property') {
        properties.push(result.property)
      }
    }
  }

  // 处理 v-model：生成 modelValue 和 onUpdate:modelValue
  if (vModelState.hasVModel && vModelState.value) {
    const vModelProps = createVModelProps(
      vModelState.value,
      vModelState.node,
      existingPropNames,
      node,
      ctx
    )
    properties.push(...vModelProps)
  }

  // 构建最终结果
  const props = properties.length > 0 ? t.objectExpression(properties) : null
  return { props, directives, hasVBind }
}
