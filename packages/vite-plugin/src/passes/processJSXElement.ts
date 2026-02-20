import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { TransformContext, markImport } from '../context'
import {
  isJSXElement,
  isJSXFragment,
  isJSXText,
  isJSXExpressionContainer,
  isVIfChain,
  isVIf,
  isVElse,
  isVElseIf,
  isComponent,
  isNativeElement,
  isIdentifier,
  getJSXElementName,
  getDirectiveValue,
  createCreateViewCall,
  createLocationObject,
  createUnrefCall,
  createBranchCall,
  createArrowFunction,
  addPureComment,
  getAlias,
} from '../utils/ast'
import { processProps } from './processProps'
import { processDirectives } from './processDirectives'
import { processChildren } from './processChildren'
import { createError } from '../error'

export function processJSXElement(path: NodePath<t.JSXElement>, ctx: TransformContext): void {
  const result = transformJSXElement(path.node, ctx, true)
  if (result) {
    path.replaceWith(result)
  }
}

export function transformJSXElement(node: t.JSXElement, ctx: TransformContext, handleVIf: boolean = false): t.Expression | null {
  const name = getJSXElementName(node)

  if (!name) return null

  if (handleVIf && isVIfChain(node)) {
    if (isVIf(node)) {
      return transformSingleVIf(node, ctx)
    } else {
      throw createError(isVElse(node) ? 'E003' : 'E004', node)
    }
  }

  let type: t.Expression
  if (isNativeElement(name)) {
    type = t.stringLiteral(name)
  } else {
    type = t.identifier(name)
  }

  const { props, directives } = processProps(node, ctx)

  const children = node.children.filter(child => {
    if (isJSXText(child)) {
      return child.value.trim().length > 0
    }
    if (isJSXExpressionContainer(child)) {
      return child.expression.type !== 'JSXEmptyExpression'
    }
    return true
  })

  let finalProps = props
  if (children.length > 0) {
    const processedChildren = processChildren(children, ctx)
    const childrenValue = processedChildren.length === 1
      ? processedChildren[0]
      : t.arrayExpression(processedChildren)

    if (finalProps) {
      finalProps.properties.push(
        t.objectProperty(t.identifier('children'), childrenValue)
      )
    } else {
      finalProps = t.objectExpression([
        t.objectProperty(t.identifier('children'), childrenValue)
      ])
    }
  }

  markImport(ctx, 'createView')
  const createViewAlias = getAlias(ctx.vitarxAliases, 'createView')

  const locInfo = ctx.options.dev && node.loc
    ? createLocationObject(ctx.filename, node.loc)
    : null

  let viewCall = createCreateViewCall(type, finalProps, locInfo, createViewAlias)

  if (directives.size > 0) {
    viewCall = processDirectives(viewCall, directives, ctx)
  } else {
    viewCall = addPureComment(viewCall)
  }

  if (node.loc) {
    viewCall.loc = node.loc
  }

  return viewCall
}

function transformSingleVIf(node: t.JSXElement, ctx: TransformContext): t.CallExpression | null {
  if (!isVIf(node)) return null
  
  const condition = getDirectiveValue(node, 'v-if')
  if (!condition) {
    return null
  }

  const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')
  const branchAlias = getAlias(ctx.vitarxAliases, 'branch')

  const conditionExpr = isIdentifier(condition)
    ? createUnrefCall(condition, unrefAlias)
    : condition

  removeVDirectives(node)

  markImport(ctx, 'branch')
  markImport(ctx, 'unref')

  const transformedNode = transformJSXElement(node, ctx, false)
  if (!transformedNode) return null
  
  const branchCall = addPureComment(createBranchCall(
    createArrowFunction(
      t.conditionalExpression(conditionExpr, t.numericLiteral(0), t.nullLiteral())
    ),
    [createArrowFunction(transformedNode)],
    branchAlias
  ))

  if (node.loc) {
    branchCall.loc = node.loc
  }

  return branchCall
}

function removeVDirectives(node: t.JSXElement): void {
  node.openingElement.attributes = node.openingElement.attributes.filter(attr => {
    if (attr.type === 'JSXAttribute') {
      const name = attr.name
      if (name.type === 'JSXIdentifier') {
        return !name.name.startsWith('v-')
      }
    }
    return true
  })
}
