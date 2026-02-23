/**
 * Switch 组件处理器
 * 将 <Switch><Match when={cond}>...</Match></Switch> 编译为 branch 调用
 * @module passes/components/switch
 */
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { isJSXElement, isJSXText } from '@babel/types'
import { TransformContext } from '../../context'
import { createError } from '../../error'
import {
  createArrowFunction,
  createBranch,
  getJSXAttributeByName,
  getJSXElementName
} from '../../utils/index.js'

/**
 * 处理 Switch 组件
 * @param path - JSX 元素路径
 * @param ctx - 转换上下文
 */
export function processSwitch(path: NodePath<t.JSXElement>, ctx: TransformContext): void {
  const children = path.node.children

  // 获取 fallback 属性
  const fallbackValue = extractFallbackValue(path.node)

  // 收集 Match 子节点
  const matchNodes = collectMatchNodes(children)

  // 构建条件和分支
  const { conditions, branches } = buildConditionsAndBranches(matchNodes)

  // 添加 fallback 分支
  if (fallbackValue) {
    conditions.push(t.booleanLiteral(true))
    branches.push(createArrowFunction(fallbackValue))
  }

  // 生成 branch 调用
  const branchCall = createBranch({ conditions, branches, useRef: false }, ctx)

  if (path.node.loc) {
    branchCall.loc = path.node.loc
  }

  path.replaceWith(branchCall)
}

/**
 * 提取 fallback 属性值
 */
function extractFallbackValue(node: t.JSXElement): t.Expression | null {
  const fallbackAttr = getJSXAttributeByName(node, 'fallback')
  if (!fallbackAttr?.value) return null

  if (fallbackAttr.value.type === 'JSXExpressionContainer') {
    return fallbackAttr.value.expression as t.Expression
  }
  return fallbackAttr.value
}

/**
 * 收集 Match 子节点
 */
function collectMatchNodes(children: t.Node[]): t.JSXElement[] {
  const matchNodes: t.JSXElement[] = []

  for (const child of children) {
    if (isJSXText(child)) continue

    if (!isJSXElement(child)) {
      throw createError('E006', child, 'Switch children must be Match components')
    }

    const childName = getJSXElementName(child)
    if (childName === 'Match') {
      matchNodes.push(child)
    } else {
      throw createError('E006', child, `Invalid child "${childName}" in Switch`)
    }
  }

  if (matchNodes.length === 0) {
    throw createError('E006', undefined, 'Switch must have at least one Match child')
  }

  return matchNodes
}

/**
 * 构建条件数组和分支数组
 */
function buildConditionsAndBranches(matchNodes: t.JSXElement[]): {
  conditions: t.Expression[]
  branches: t.ArrowFunctionExpression[]
} {
  const conditions: t.Expression[] = []
  const branches: t.ArrowFunctionExpression[] = []

  for (const matchNode of matchNodes) {
    const whenAttr = getJSXAttributeByName(matchNode, 'when')
    if (!whenAttr?.value) {
      throw createError('E007', matchNode)
    }

    // 提取 when 条件
    const whenExpr =
      whenAttr.value.type === 'JSXExpressionContainer'
        ? (whenAttr.value.expression as t.Expression)
        : whenAttr.value
    conditions.push(whenExpr)

    // 提取分支内容
    const matchChildren = matchNode.children.filter(c => !isJSXText(c) || c.value.trim())

    if (matchChildren.length === 1) {
      const child = matchChildren[0]
      if (isJSXText(child)) {
        branches.push(createArrowFunction(t.stringLiteral(child.value.trim())))
      } else {
        branches.push(createArrowFunction(child as t.Expression))
      }
    } else if (matchChildren.length > 1) {
      branches.push(createArrowFunction(t.arrayExpression(matchChildren as t.Expression[])))
    } else {
      branches.push(createArrowFunction(t.nullLiteral()))
    }
  }

  return { conditions, branches }
}
