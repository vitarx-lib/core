/**
 * IfBlock 组件处理器
 * 将 <IfBlock><div v-if>...</div><div v-else>...</div></IfBlock> 编译为 branch 调用
 * @module passes/components/ifBlock
 */
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { TransformContext } from '../../context'
import { createError } from '../../error'
import {
  isJSXElement,
  hasDirective,
  removeVDirectives,
  createArrowFunction,
  validateVIfChain,
  collectVIfChainInfo,
  createBranch,
  filterWhitespaceChildren
} from '../../utils/index.js'

/**
 * 处理 IfBlock 组件
 */
export function processIfBlock(path: NodePath<t.JSXElement>, ctx: TransformContext): void {
  const children = filterWhitespaceChildren(path.node.children)

  validateChildrenType(children)

  const jsxChildren = children as t.JSXElement[]
  validateVIfChain(jsxChildren)

  const { nodes, conditions } = collectVIfChainInfo(jsxChildren)

  nodes.forEach(node => removeVDirectives(node))
  const branches = nodes.map(node => createArrowFunction(node as t.Expression))

  const branchCall = createBranch({ conditions, branches }, ctx)

  if (path.node.loc) {
    branchCall.loc = path.node.loc
  }

  path.replaceWith(branchCall)
}

/**
 * 验证子元素类型
 */
function validateChildrenType(children: t.Node[]): void {
  for (const child of children) {
    if (!isJSXElement(child)) {
      throw createError('E008', child, 'IfBlock children must be JSX elements with v-if directives')
    }

    if (!hasVIfChainDirective(child)) {
      throw createError('E008', child, 'IfBlock children must have v-if/v-else-if/v-else directives')
    }
  }
}

/**
 * 检查元素是否有 v-if 链指令
 */
function hasVIfChainDirective(node: t.JSXElement): boolean {
  return hasDirective(node, 'v-if') || hasDirective(node, 'v-else-if') || hasDirective(node, 'v-else')
}
