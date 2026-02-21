/**
 * Switch 组件处理器
 * 将 <Switch><Match when={cond}>...</Match></Switch> 编译为 branch 调用
 * @module passes/components/switch
 */
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { markImport, TransformContext } from '../../context'
import { createError } from '../../error'
import {
  addPureComment,
  createArrowFunction,
  createBranchCall,
  getAlias,
  getJSXAttributeByName,
  getJSXElementName,
  isJSXElement,
  isJSXText
} from '../../utils/index.js'

/**
 * 处理 Switch 组件
 * @param path - JSX 元素路径
 * @param ctx - 转换上下文
 */
export function processSwitch(path: NodePath<t.JSXElement>, ctx: TransformContext): void {
  const children = path.node.children
  const matchNodes: t.JSXElement[] = []

  // 获取 fallback 属性
  const fallbackAttr = getJSXAttributeByName(path.node, 'fallback')
  const fallbackValue = extractAttributeValue(fallbackAttr)

  // 收集 Match 子节点
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
    throw createError('E006', path.node, 'Switch must have at least one Match child')
  }

  // 构建条件和分支
  const { conditions, branches } = buildConditionsAndBranches(matchNodes)

  // 构建条件表达式
  const conditionExpr = buildConditionExpression(conditions, fallbackValue !== null)

  // 添加 fallback 分支
  if (fallbackValue) {
    branches.push(createArrowFunction(fallbackValue))
  }

  // 生成 branch 调用
  markImport(ctx, 'branch')
  const branchAlias = getAlias(ctx.vitarxAliases, 'branch')
  const branchCall = addPureComment(
    createBranchCall(createArrowFunction(conditionExpr), branches, branchAlias)
  )

  if (path.node.loc) {
    branchCall.loc = path.node.loc
  }

  path.replaceWith(branchCall)
}

/**
 * 提取属性值
 */
function extractAttributeValue(attr: t.JSXAttribute | undefined): t.Expression | null {
  if (!attr || !attr.value) return null

  if (attr.value.type === 'JSXExpressionContainer') {
    return attr.value.expression as t.Expression
  }
  return attr.value
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
    if (!whenAttr || !whenAttr.value) {
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

/**
 * 构建条件表达式
 * 从后向前构建嵌套的三元表达式
 */
function buildConditionExpression(conditions: t.Expression[], hasFallback: boolean): t.Expression {
  let conditionExpr: t.Expression | null = null
  const lastIndex = conditions.length - 1

  for (let i = lastIndex; i >= 0; i--) {
    if (conditionExpr === null) {
      // 最后一个条件
      if (hasFallback) {
        conditionExpr = t.conditionalExpression(
          conditions[i],
          t.numericLiteral(i),
          t.numericLiteral(lastIndex + 1)
        )
      } else {
        conditionExpr = t.conditionalExpression(conditions[i], t.numericLiteral(i), t.nullLiteral())
      }
    } else {
      conditionExpr = t.conditionalExpression(conditions[i], t.numericLiteral(i), conditionExpr)
    }
  }

  return conditionExpr || t.nullLiteral()
}
