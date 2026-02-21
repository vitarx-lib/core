/**
 * 子元素处理模块
 * 处理 JSX 元素的子节点
 * @module passes/jsx/processChildren
 */
import * as t from '@babel/types'
import { markImport, TransformContext } from '../../context'
import {
  addPureComment,
  createAccessCall,
  createArrowFunction,
  createBranchCall,
  createDynamicCall,
  getAlias,
  isBooleanLiteral,
  isConditionalExpression,
  isIdentifier,
  isJSXElement,
  isJSXExpressionContainer,
  isJSXFragment,
  isJSXText,
  isLogicalExpression,
  isMemberExpression,
  isNumericLiteral,
  isStringLiteral
} from '../../utils/index.js'

/**
 * 处理子节点数组
 * @param children - 子节点数组
 * @param ctx - 转换上下文
 * @returns 处理后的表达式数组
 */
export function processChildren(children: t.Node[], ctx: TransformContext): t.Expression[] {
  const result: t.Expression[] = []

  for (const child of children) {
    const processed = processChildNode(child as t.Expression, ctx)
    if (processed !== null) {
      result.push(processed)
    }
  }

  return result
}

/**
 * 处理单个子节点
 */
function processChildNode(node: t.Node, ctx: TransformContext): t.Expression | null {
  // JSX 文本
  if (isJSXText(node)) {
    const trimmed = node.value.trim()
    if (!trimmed) return null
    return t.stringLiteral(trimmed)
  }

  // JSX 表达式容器
  if (isJSXExpressionContainer(node)) {
    if (node.expression.type === 'JSXEmptyExpression') return null
    return processChildExpression(node.expression as t.Expression, ctx)
  }

  // JSX 展开子元素
  if (node.type === 'JSXSpreadChild') {
    return processChildExpression(node.expression, ctx)
  }

  // JSX 元素或片段
  if (isJSXElement(node) || isJSXFragment(node)) {
    return node as t.Expression
  }

  // 字面量
  if (isStringLiteral(node) || isNumericLiteral(node) || isBooleanLiteral(node)) {
    return node
  }

  // 标识符
  if (isIdentifier(node)) {
    return node
  }

  // 成员表达式
  if (isMemberExpression(node)) {
    markImport(ctx, 'access')
    const accessAlias = getAlias(ctx.vitarxAliases, 'access')
    return createAccessCall(node.object, node.property as t.Expression, accessAlias)
  }

  // 条件表达式
  if (isConditionalExpression(node)) {
    return processConditionalExpression(node, ctx)
  }

  // 逻辑表达式
  if (isLogicalExpression(node)) {
    markImport(ctx, 'dynamic')
    const dynamicAlias = getAlias(ctx.vitarxAliases, 'dynamic')
    return addPureComment(createDynamicCall(node, dynamicAlias))
  }

  // 调用表达式
  if (node.type === 'CallExpression') {
    return node as t.Expression
  }

  return node as t.Expression
}

/**
 * 处理子表达式
 */
function processChildExpression(expr: t.Expression, ctx: TransformContext): t.Expression {
  if (isIdentifier(expr)) {
    return expr
  }

  if (isMemberExpression(expr)) {
    markImport(ctx, 'access')
    const accessAlias = getAlias(ctx.vitarxAliases, 'access')
    return createAccessCall(expr.object, expr.property as t.Expression, accessAlias)
  }

  if (isConditionalExpression(expr)) {
    return processConditionalExpression(expr, ctx)
  }

  if (isLogicalExpression(expr)) {
    markImport(ctx, 'dynamic')
    const dynamicAlias = getAlias(ctx.vitarxAliases, 'dynamic')
    return addPureComment(createDynamicCall(expr, dynamicAlias))
  }

  return expr
}

/**
 * 处理条件表达式
 * 转换为 branch 调用
 */
function processConditionalExpression(
  node: t.ConditionalExpression,
  ctx: TransformContext
): t.CallExpression {
  const { test, consequent, alternate } = node

  // 构建条件表达式
  let conditionExpr: t.Expression
  if (isIdentifier(test)) {
    markImport(ctx, 'unref')
    const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')
    conditionExpr = t.callExpression(t.identifier(unrefAlias), [test])
  } else {
    conditionExpr = test
  }

  // 处理分支
  const processedConsequent = processChildNode(consequent, ctx)
  const processedAlternate = processChildNode(alternate, ctx)

  // 生成 branch 调用
  markImport(ctx, 'branch')
  const branchAlias = getAlias(ctx.vitarxAliases, 'branch')
  return addPureComment(
    createBranchCall(
      createArrowFunction(
        t.conditionalExpression(conditionExpr, t.numericLiteral(0), t.numericLiteral(1))
      ),
      [
        createArrowFunction(processedConsequent || t.nullLiteral()),
        createArrowFunction(processedAlternate || t.nullLiteral())
      ],
      branchAlias
    )
  )
}
