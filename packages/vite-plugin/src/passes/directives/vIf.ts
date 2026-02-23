/**
 * v-if 链处理器
 * 处理 Fragment 中的 v-if/v-else-if/v-else 链
 * @module passes/directives/vIf
 */
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { isJSXElement, isJSXText } from '@babel/types'
import { TransformContext } from '../../context'
import {
  collectFragmentVIfChains,
  createArrowFunction,
  createBranch,
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
  const chains = collectFragmentVIfChains(children)

  if (chains.length === 0) return

  // 从后向前处理链，避免索引偏移问题
  for (let c = chains.length - 1; c >= 0; c--) {
    processVIfChainItem(chains[c], children, ctx, transformJSXElement)
  }

  // 清理已处理的节点
  cleanupProcessedChildren(path, children)
}

/**
 * 处理单个 v-if 链
 */
function processVIfChainItem(
  chain: { nodes: t.JSXElement[]; conditions: t.Expression[]; endIndex: number },
  children: t.Node[],
  ctx: TransformContext,
  transformJSXElement: TransformJSXElementFn
): void {
  const { nodes, conditions, endIndex } = chain

  // 计算链在 children 中的起始位置
  let start = -1
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (isJSXElement(child) && child === nodes[0]) {
      start = i
      break
    }
  }

  // 移除指令并转换节点
  const branches: t.ArrowFunctionExpression[] = []
  for (const node of nodes) {
    removeVDirectives(node)
    const transformedNode = transformJSXElement(node, ctx, false)
    if (transformedNode) {
      branches.push(createArrowFunction(transformedNode))
    }
  }

  // 生成 branch 调用
  const branchCall = createBranch({ conditions, branches }, ctx)

  // 替换链的第一个节点，其他节点标记为 null
  if (start >= 0) {
    children[start] = branchCall as any
    for (let k = start + 1; k <= endIndex; k++) {
      children[k] = t.nullLiteral() as any
    }
  }
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
