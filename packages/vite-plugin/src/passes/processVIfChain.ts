import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { TransformContext, markImport } from '../context'
import {
  isJSXElement,
  isJSXText,
  isJSXFragment,
  isJSXExpressionContainer,
  isIdentifier,
  isVIf,
  isVElseIf,
  isVElse,
  isVIfChain,
  isWhitespaceJSXText,
  isBooleanLiteral,
  getDirectiveValue,
  createBranchCall,
  createArrowFunction,
  createUnrefCall,
  addPureComment,
  getAlias,
} from '../utils/ast'
import { createError } from '../error'
import { transformJSXElement } from './processJSXElement'

export function processVIfChain(path: NodePath<t.JSXFragment>, ctx: TransformContext): void {
  processFragmentVIfChains(path, ctx)
}

function processFragmentVIfChains(
  fragmentPath: NodePath<t.JSXFragment>,
  ctx: TransformContext
): void {
  const children = fragmentPath.node.children
  const chains: Array<{ start: number; end: number; nodes: t.JSXElement[]; conditions: t.Expression[] }> = []

  let i = 0
  while (i < children.length) {
    const child = children[i]

    if (isJSXText(child)) {
      i++
      continue
    }

    if (!isJSXElement(child)) {
      i++
      continue
    }

    if (!isVIfChain(child)) {
      i++
      continue
    }

    if (isVIf(child)) {
      const chainNodes: t.JSXElement[] = [child]
      const chainConditions: t.Expression[] = [getDirectiveValue(child, 'v-if')!]

      let j = i + 1
      while (j < children.length) {
        const nextChild = children[j]
        if (isJSXText(nextChild) && isWhitespaceJSXText(nextChild)) {
          j++
          continue
        }
        if (!isJSXElement(nextChild)) break
        if (!isVIfChain(nextChild)) break

        if (isVElseIf(nextChild)) {
          chainNodes.push(nextChild)
          chainConditions.push(getDirectiveValue(nextChild, 'v-else-if')!)
          j++
        } else if (isVElse(nextChild)) {
          chainNodes.push(nextChild)
          chainConditions.push(t.booleanLiteral(true))
          j++
          break
        } else {
          break
        }
      }

      chains.push({ start: i, end: j - 1, nodes: chainNodes, conditions: chainConditions })
      i = j
    } else if (isVElseIf(child) || isVElse(child)) {
      throw createError(isVElse(child) ? 'E003' : 'E004', child)
    } else {
      i++
    }
  }

  const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')
  const branchAlias = getAlias(ctx.vitarxAliases, 'branch')

  for (let c = chains.length - 1; c >= 0; c--) {
    const chain = chains[c]
    const { nodes, conditions, start, end } = chain

    const branches: t.ArrowFunctionExpression[] = []
    let conditionExpr: t.Expression | null = null
    const lastIndex = nodes.length - 1
    const hasVElse = isBooleanLiteral(conditions[lastIndex]) && conditions[lastIndex].value === true

    for (let k = lastIndex; k >= 0; k--) {
      const condition = conditions[k]
      const node = nodes[k]
      
      removeVDirectives(node)
      
      const transformedNode = transformJSXElement(node, ctx, false)
      if (transformedNode) {
        branches.unshift(createArrowFunction(transformedNode))
      }

      if (isBooleanLiteral(condition) && condition.value === true) {
        conditionExpr = t.numericLiteral(k)
      } else {
        const conditionExprInner = isIdentifier(condition)
          ? createUnrefCall(condition, unrefAlias)
          : condition
        
        if (conditionExpr === null) {
          conditionExpr = t.conditionalExpression(conditionExprInner, t.numericLiteral(k), t.nullLiteral())
        } else {
          conditionExpr = t.conditionalExpression(conditionExprInner, t.numericLiteral(k), conditionExpr)
        }
      }
    }

    if (conditionExpr === null) {
      conditionExpr = t.nullLiteral()
    }

    markImport(ctx, 'branch')
    markImport(ctx, 'unref')

    const branchCall = addPureComment(createBranchCall(
      createArrowFunction(conditionExpr),
      branches,
      branchAlias
    ))

    children[start] = branchCall as any
    for (let k = start + 1; k <= end; k++) {
      children[k] = t.nullLiteral() as any
    }
  }

  fragmentPath.node.children = children.filter(child => {
    if (t.isNullLiteral(child)) return false
    if (isJSXText(child) && isWhitespaceJSXText(child)) return false
    return true
  })
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
