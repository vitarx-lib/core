import * as t from '@babel/types'
import { TransformContext, markImport } from '../context'
import {
  isJSXText,
  isJSXElement,
  isJSXFragment,
  isJSXExpressionContainer,
  isIdentifier,
  isMemberExpression,
  isConditionalExpression,
  isLogicalExpression,
  isStringLiteral,
  isNumericLiteral,
  isBooleanLiteral,
  createAccessCall,
  createDynamicCall,
  createBranchCall,
  createArrowFunction,
  addPureComment,
  getAlias,
} from '../utils/ast'

export function processChildren(
  children: t.Node[],
  ctx: TransformContext
): t.Expression[] {
  const result: t.Expression[] = []

  for (const child of children) {
    const processed = processChildNode(child as t.Expression, ctx)
    if (processed !== null) {
      result.push(processed)
    }
  }

  return result
}

function processChildNode(node: t.Node, ctx: TransformContext): t.Expression | null {
  if (isJSXText(node)) {
    const trimmed = node.value.trim()
    if (!trimmed) return null
    return t.stringLiteral(trimmed)
  }

  if (isJSXExpressionContainer(node)) {
    if (node.expression.type === 'JSXEmptyExpression') return null
    return processChildExpression(node.expression as t.Expression, ctx)
  }

  if (node.type === 'JSXSpreadChild') {
    return processChildExpression(node.expression, ctx)
  }

  if (isJSXElement(node) || isJSXFragment(node)) {
    return node as t.Expression
  }

  if (isStringLiteral(node)) {
    return node
  }

  if (isNumericLiteral(node)) {
    return node
  }

  if (isBooleanLiteral(node)) {
    return node
  }

  if (isIdentifier(node)) {
    return node
  }

  if (isMemberExpression(node)) {
    markImport(ctx, 'access')
    const accessAlias = getAlias(ctx.vitarxAliases, 'access')
    return createAccessCall(node.object, node.property as t.Expression, accessAlias)
  }

  if (isConditionalExpression(node)) {
    return processConditionalExpression(node, ctx)
  }

  if (isLogicalExpression(node)) {
    markImport(ctx, 'dynamic')
    const dynamicAlias = getAlias(ctx.vitarxAliases, 'dynamic')
    return addPureComment(createDynamicCall(node, dynamicAlias))
  }

  if (node.type === 'CallExpression') {
    return node as t.Expression
  }

  return node as t.Expression
}

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

function processConditionalExpression(
  node: t.ConditionalExpression,
  ctx: TransformContext
): t.CallExpression {
  const { test, consequent, alternate } = node

  let conditionExpr: t.Expression
  if (isIdentifier(test)) {
    markImport(ctx, 'unref')
    const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')
    conditionExpr = t.callExpression(t.identifier(unrefAlias), [test])
  } else {
    conditionExpr = test
  }

  const processedConsequent = processChildNode(consequent, ctx)
  const processedAlternate = processChildNode(alternate, ctx)

  markImport(ctx, 'branch')
  const branchAlias = getAlias(ctx.vitarxAliases, 'branch')
  return addPureComment(createBranchCall(
    createArrowFunction(
      t.conditionalExpression(conditionExpr, t.numericLiteral(0), t.numericLiteral(1))
    ),
    [
      createArrowFunction(processedConsequent || t.nullLiteral()),
      createArrowFunction(processedAlternate || t.nullLiteral()),
    ],
    branchAlias
  ))
}
