/**
 * v-if 链处理器
 * 处理 Fragment 中的 v-if/v-else-if/v-else 链
 * @module passes/directives/vIf
 */
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { markImport, TransformContext } from '../../context'
import { createError } from '../../error'
import {
  addPureComment,
  createArrowFunction,
  createBranchCall,
  createUnrefCall,
  getAlias,
  getDirectiveValue,
  isBooleanLiteral,
  isIdentifier,
  isJSXElement,
  isJSXText,
  isVElse,
  isVElseIf,
  isVIf,
  isVIfChain,
  isWhitespaceJSXText,
  removeVDirectives
} from '../../utils/index.js'

/**
 * JSX 元素转换函数类型
 */
type TransformJSXElementFn = (
  node: t.JSXElement,
  ctx: TransformContext,
  handleVIf: boolean
) => t.Expression | null

/**
 * v-if 链信息
 */
interface VIfChain {
  start: number
  end: number
  nodes: t.JSXElement[]
  conditions: t.Expression[]
}

/**
 * 处理 Fragment 中的 v-if 链
 * @param path - JSX Fragment 路径
 * @param ctx - 转换上下文
 * @param transformJSXElement - JSX 元素转换函数
 */
export function processVIfChain(
  path: NodePath<t.JSXFragment>,
  ctx: TransformContext,
  transformJSXElement: TransformJSXElementFn
): void {
  const children = path.node.children
  const chains = collectVIfChains(children)

  if (chains.length === 0) return

  const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')
  const branchAlias = getAlias(ctx.vitarxAliases, 'branch')

  // 从后向前处理链，避免索引偏移问题
  for (let c = chains.length - 1; c >= 0; c--) {
    processVIfChainItem(chains[c], children, ctx, unrefAlias, branchAlias, transformJSXElement)
  }

  // 清理已处理的节点
  cleanupProcessedChildren(path, children)
}

/**
 * 收集所有 v-if 链
 */
function collectVIfChains(children: t.Node[]): VIfChain[] {
  const chains: VIfChain[] = []
  let i = 0

  while (i < children.length) {
    const child = children[i]

    // 跳过文本节点
    if (isJSXText(child)) {
      i++
      continue
    }

    // 跳过非 JSX 元素
    if (!isJSXElement(child)) {
      i++
      continue
    }

    // 跳过非 v-if 链
    if (!isVIfChain(child)) {
      i++
      continue
    }

    // 处理 v-if 链
    if (isVIf(child)) {
      const chain = collectSingleChain(children, i)
      chains.push(chain)
      i = chain.end + 1
    } else if (isVElseIf(child) || isVElse(child)) {
      // 孤立的 v-else-if 或 v-else
      throw createError(isVElse(child) ? 'E003' : 'E004', child)
    } else {
      i++
    }
  }

  return chains
}

/**
 * 收集单个 v-if 链
 */
function collectSingleChain(children: t.Node[], startIndex: number): VIfChain {
  const chainNodes: t.JSXElement[] = [children[startIndex] as t.JSXElement]
  const chainConditions: t.Expression[] = [getDirectiveValue(chainNodes[0], 'v-if')!]

  let j = startIndex + 1
  while (j < children.length) {
    const nextChild = children[j]

    // 跳过空白文本
    if (isJSXText(nextChild) && isWhitespaceJSXText(nextChild)) {
      j++
      continue
    }

    // 必须是 JSX 元素
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

  return {
    start: startIndex,
    end: j - 1,
    nodes: chainNodes,
    conditions: chainConditions
  }
}

/**
 * 处理单个 v-if 链
 */
function processVIfChainItem(
  chain: VIfChain,
  children: t.Node[],
  ctx: TransformContext,
  unrefAlias: string,
  branchAlias: string,
  transformJSXElement: TransformJSXElementFn
): void {
  const { nodes, conditions, start, end } = chain

  const branches: t.ArrowFunctionExpression[] = []
  let conditionExpr: t.Expression | null = null
  const lastIndex = nodes.length - 1

  // 从后向前构建条件和分支
  for (let k = lastIndex; k >= 0; k--) {
    const condition = conditions[k]
    const node = nodes[k]

    // 移除 v- 指令
    removeVDirectives(node)

    // 转换节点
    const transformedNode = transformJSXElement(node, ctx, false)
    if (transformedNode) {
      branches.unshift(createArrowFunction(transformedNode))
    }

    // 构建条件表达式
    conditionExpr = buildConditionExpression(condition, conditionExpr, k, unrefAlias)
  }

  if (conditionExpr === null) {
    conditionExpr = t.nullLiteral()
  }

  markImport(ctx, 'branch')
  markImport(ctx, 'unref')

  const branchCall = addPureComment(
    createBranchCall(createArrowFunction(conditionExpr), branches, branchAlias)
  )

  // 替换链的第一个节点，其他节点标记为 null
  children[start] = branchCall as any
  for (let k = start + 1; k <= end; k++) {
    children[k] = t.nullLiteral() as any
  }
}

/**
 * 构建条件表达式
 */
function buildConditionExpression(
  condition: t.Expression,
  nextCondition: t.Expression | null,
  index: number,
  unrefAlias: string
): t.Expression {
  if (isBooleanLiteral(condition) && condition.value) {
    return t.numericLiteral(index)
  }

  const conditionExprInner = isIdentifier(condition)
    ? createUnrefCall(condition, unrefAlias)
    : condition

  if (nextCondition === null) {
    return t.conditionalExpression(conditionExprInner, t.numericLiteral(index), t.nullLiteral())
  }

  return t.conditionalExpression(conditionExprInner, t.numericLiteral(index), nextCondition)
}

/**
 * 清理已处理的子节点
 */
function cleanupProcessedChildren(path: NodePath<t.JSXFragment>, children: t.Node[]): void {
  path.node.children = children.filter(child => {
    if (t.isNullLiteral(child)) return false
    return !(isJSXText(child) && isWhitespaceJSXText(child))
  }) as t.JSXFragment['children']
}
