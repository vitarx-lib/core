import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { TransformContext, markImport } from '../context'
import {
  isJSXText,
  isJSXElement,
  isJSXFragment,
  isJSXExpressionContainer,
  createCreateViewCall,
  createLocationObject,
  addPureComment,
  getAlias,
} from '../utils/ast'
import { processChildren } from './processChildren'

export function processJSXFragment(path: NodePath<t.JSXFragment>, ctx: TransformContext): void {
  const node = path.node
  const children = node.children
  const processedChildren: t.Expression[] = []

  for (const child of children) {
    if (isJSXText(child)) {
      const trimmed = child.value.trim()
      if (trimmed) {
        processedChildren.push(t.stringLiteral(trimmed))
      }
      continue
    }

    if (isJSXExpressionContainer(child)) {
      if (child.expression.type === 'JSXEmptyExpression') continue
      processedChildren.push(child.expression as t.Expression)
      continue
    }

    if (child.type === 'JSXSpreadChild') {
      processedChildren.push(child.expression)
      continue
    }

    if (isJSXElement(child) || isJSXFragment(child)) {
      processedChildren.push(child as t.Expression)
      continue
    }

    processedChildren.push(child as t.Expression)
  }

  markImport(ctx, 'Fragment')
  markImport(ctx, 'createView')

  const fragmentAlias = getAlias(ctx.vitarxAliases, 'Fragment')
  const createViewAlias = getAlias(ctx.vitarxAliases, 'createView')

  const locInfo = ctx.options.dev && node.loc
    ? createLocationObject(ctx.filename, node.loc)
    : null

  if (processedChildren.length === 0) {
    const viewCall = addPureComment(
      createCreateViewCall(t.identifier(fragmentAlias), null, locInfo, createViewAlias)
    )
    if (node.loc) {
      viewCall.loc = node.loc
    }
    path.replaceWith(viewCall)
    return
  }

  const childrenValue = processedChildren.length === 1
    ? processedChildren[0]
    : t.arrayExpression(processedChildren)

  const props = t.objectExpression([
    t.objectProperty(t.identifier('children'), childrenValue)
  ])

  const viewCall = addPureComment(
    createCreateViewCall(t.identifier(fragmentAlias), props, locInfo, createViewAlias)
  )
  if (node.loc) {
    viewCall.loc = node.loc
  }
  path.replaceWith(viewCall)
}
