import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { TransformContext, markImport } from '../context'
import {
  isJSXElement,
  isJSXText,
  isJSXExpressionContainer,
  getJSXElementName,
  isPureCompileComponent,
  getJSXAttributeByName,
  createBranchCall,
  createArrowFunction,
  addPureComment,
  getAlias,
} from '../utils/ast'
import { createError } from '../error'

export function processPureCompileComponent(path: NodePath<t.JSXElement>, ctx: TransformContext): void {
  const name = getJSXElementName(path.node)
  if (!name || !isPureCompileComponent(name)) return

  if (name === 'Switch') {
    processSwitch(path, ctx)
  } else if (name === 'IfBlock') {
    processIfBlock(path, ctx)
  }
}

function processSwitch(path: NodePath<t.JSXElement>, ctx: TransformContext): void {
  const children = path.node.children
  const matchNodes: t.JSXElement[] = []
  
  const fallbackAttr = getJSXAttributeByName(path.node, 'fallback')
  let fallbackValue: t.Expression | null = null
  if (fallbackAttr && fallbackAttr.value) {
    if (fallbackAttr.value.type === 'JSXExpressionContainer') {
      fallbackValue = fallbackAttr.value.expression as t.Expression
    } else {
      fallbackValue = fallbackAttr.value
    }
  }

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

  const conditions: t.Expression[] = []
  const branches: t.ArrowFunctionExpression[] = []

  for (let i = 0; i < matchNodes.length; i++) {
    const matchNode = matchNodes[i]
    const whenAttr = getJSXAttributeByName(matchNode, 'when')
    if (!whenAttr || !whenAttr.value) {
      throw createError('E007', matchNode)
    }
    let whenExpr: t.Expression
    if (whenAttr.value.type === 'JSXExpressionContainer') {
      whenExpr = whenAttr.value.expression as t.Expression
    } else {
      whenExpr = whenAttr.value
    }
    conditions.push(whenExpr)

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

  let conditionExpr: t.Expression | null = null
  const lastIndex = conditions.length - 1

  for (let i = lastIndex; i >= 0; i--) {
    if (conditionExpr === null) {
      if (fallbackValue) {
        conditionExpr = t.conditionalExpression(conditions[i], t.numericLiteral(i), t.numericLiteral(lastIndex + 1))
      } else {
        conditionExpr = t.conditionalExpression(conditions[i], t.numericLiteral(i), t.nullLiteral())
      }
    } else {
      conditionExpr = t.conditionalExpression(conditions[i], t.numericLiteral(i), conditionExpr)
    }
  }

  if (conditionExpr === null) {
    conditionExpr = t.nullLiteral()
  }

  if (fallbackValue) {
    branches.push(createArrowFunction(fallbackValue))
  }

  markImport(ctx, 'branch')
  const branchAlias = getAlias(ctx.vitarxAliases, 'branch')
  const branchCall = addPureComment(createBranchCall(
    createArrowFunction(conditionExpr),
    branches,
    branchAlias
  ))
  if (path.node.loc) {
    branchCall.loc = path.node.loc
  }
  path.replaceWith(branchCall)
}

function processIfBlock(path: NodePath<t.JSXElement>, ctx: TransformContext): void {
  const children = path.node.children
  const nonWhitespaceChildren = children.filter(c => !isJSXText(c) || c.value.trim())

  for (const child of nonWhitespaceChildren) {
    if (!isJSXElement(child)) {
      throw createError('E008', child, 'IfBlock children must be JSX elements with v-if directives')
    }
    const hasVIf = child.openingElement.attributes.some(attr => {
      if (attr.type === 'JSXAttribute') {
        const name = attr.name
        if (name.type === 'JSXIdentifier') {
          return name.name === 'v-if' || name.name === 'v-else-if' || name.name === 'v-else'
        }
      }
      return false
    })
    if (!hasVIf) {
      throw createError('E008', child, 'IfBlock children must have v-if/v-else-if/v-else directives')
    }
  }

  const result = t.arrayExpression(nonWhitespaceChildren as t.Expression[])
  path.replaceWith(result)
}
