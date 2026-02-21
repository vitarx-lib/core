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
  isJSXText,
  isWhitespaceJSXText,
  hasDirective,
  removeVDirectives,
  createArrowFunction,
  validateVIfChain,
  collectVIfChainInfo,
  createBranch
} from '../../utils/index.js'

/**
 * 处理 IfBlock 组件
 * IfBlock 是一个容器组件，用于包裹 v-if 链元素
 * 编译时会移除 IfBlock 并生成 branch 调用
 * @param path - JSX 元素路径
 * @param ctx - 转换上下文
 */
export function processIfBlock(path: NodePath<t.JSXElement>, ctx: TransformContext): void {
  const children = path.node.children
  const nonWhitespaceChildren = filterValidChildren(children)

  // 验证子元素类型
  validateChildrenType(nonWhitespaceChildren)

  // 验证并收集 v-if 链
  const jsxChildren = nonWhitespaceChildren as t.JSXElement[]
  validateVIfChain(jsxChildren)

  // 收集条件和分支
  const { nodes, conditions } = collectVIfChainInfo(jsxChildren)

  // 移除指令并创建分支
  nodes.forEach(node => removeVDirectives(node))
  const branches = nodes.map(node => createArrowFunction(node as t.Expression))

  // 生成 branch 调用
  const branchCall = createBranch({ conditions, branches }, ctx)

  if (path.node.loc) {
    branchCall.loc = path.node.loc
  }

  path.replaceWith(branchCall)
}

/**
 * 过滤有效子元素
 */
function filterValidChildren(children: t.Node[]): t.Node[] {
  return children.filter(c => !isJSXText(c) || !isWhitespaceJSXText(c))
}

/**
 * 验证子元素类型
 */
function validateChildrenType(children: t.Node[]): void {
  for (const child of children) {
    if (!isJSXElement(child)) {
      throw createError(
        'E008',
        child,
        'IfBlock children must be JSX elements with v-if directives'
      )
    }

    if (!hasVIfChainDirective(child)) {
      throw createError(
        'E008',
        child,
        'IfBlock children must have v-if/v-else-if/v-else directives'
      )
    }
  }
}

/**
 * 检查元素是否有 v-if 链指令
 */
function hasVIfChainDirective(node: t.JSXElement): boolean {
  return hasDirective(node, 'v-if') || 
         hasDirective(node, 'v-else-if') || 
         hasDirective(node, 'v-else')
}
