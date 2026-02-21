/**
 * IfBlock 组件处理器
 * 将 <IfBlock><div v-if>...</div><div v-else>...</div></IfBlock> 编译为 branch 调用
 * @module passes/components/ifBlock
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
  isIdentifier,
  isJSXElement,
  isJSXText,
  isWhitespaceJSXText,
  removeVDirectives
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
  const nonWhitespaceChildren = children.filter(c => !isJSXText(c) || !isWhitespaceJSXText(c))

  // 验证子元素
  validateIfBlockChildren(nonWhitespaceChildren)

  // 验证 v-if 链的合法性
  const jsxChildren = nonWhitespaceChildren as t.JSXElement[]
  validateVIfChain(jsxChildren)

  // 收集条件和分支
  const { conditions, branches } = collectConditionsAndBranches(jsxChildren, ctx)

  // 构建条件表达式
  const conditionExpr = buildConditionExpression(conditions)

  // 标记需要导入的 API
  markImport(ctx, 'branch')
  markImport(ctx, 'unref')

  // 生成 branch 调用
  const branchAlias = getAlias(ctx.vitarxAliases, 'branch')
  const branchCall = addPureComment(
    createBranchCall(createArrowFunction(conditionExpr), branches, branchAlias)
  )

  if (path.node.loc) {
    branchCall.loc = path.node.loc
  }

  path.replaceWith(branchCall)
}

/**
 * 收集条件和分支
 */
function collectConditionsAndBranches(
  children: t.JSXElement[],
  ctx: TransformContext
): {
  conditions: t.Expression[]
  branches: t.ArrowFunctionExpression[]
} {
  const conditions: t.Expression[] = []
  const branches: t.ArrowFunctionExpression[] = []
  const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')

  for (const child of children) {
    // 获取条件值
    const condition = getConditionValue(child)
    conditions.push(condition)

    // 移除 v- 指令
    removeVDirectives(child)

    // 创建分支
    branches.push(createArrowFunction(child as t.Expression))
  }

  return { conditions, branches }
}

/**
 * 获取元素的条件值
 */
function getConditionValue(node: t.JSXElement): t.Expression {
  // v-if
  const vIfValue = getDirectiveValue(node, 'v-if')
  if (vIfValue) return vIfValue

  // v-else-if
  const vElseIfValue = getDirectiveValue(node, 'v-else-if')
  if (vElseIfValue) return vElseIfValue

  // v-else
  if (hasDirective(node, 'v-else')) {
    return t.booleanLiteral(true)
  }

  throw createError('E008', node, 'IfBlock child missing v-if/v-else-if/v-else directive')
}

/**
 * 构建条件表达式
 */
function buildConditionExpression(conditions: t.Expression[]): t.Expression {
  if (conditions.length === 0) {
    return t.nullLiteral()
  }

  let result: t.Expression | null = null
  const lastIndex = conditions.length - 1

  for (let i = lastIndex; i >= 0; i--) {
    const condition = conditions[i]

    // 处理条件
    let conditionExpr: t.Expression
    if (isBooleanLiteral(condition) && condition.value) {
      // v-else 的情况
      conditionExpr = t.numericLiteral(i)
    } else if (isIdentifier(condition)) {
      conditionExpr = createUnrefCall(condition)
    } else {
      conditionExpr = condition
    }

    if (result === null) {
      // 最后一个条件
      if (isBooleanLiteral(conditions[i]) && (conditions[i] as t.BooleanLiteral).value) {
        // v-else 是最后一个
        result = t.numericLiteral(i)
      } else {
        result = t.conditionalExpression(conditionExpr, t.numericLiteral(i), t.nullLiteral())
      }
    } else {
      result = t.conditionalExpression(conditionExpr, t.numericLiteral(i), result)
    }
  }

  return result || t.nullLiteral()
}

/**
 * 检查是否为布尔字面量
 */
function isBooleanLiteral(node: t.Node): node is t.BooleanLiteral {
  return node.type === 'BooleanLiteral'
}

/**
 * 验证 IfBlock 子元素
 */
function validateIfBlockChildren(children: t.Node[]): void {
  for (const child of children) {
    if (!isJSXElement(child)) {
      throw createError('E008', child, 'IfBlock children must be JSX elements with v-if directives')
    }

    const hasVIfDirective = hasVIfChainDirective(child)
    if (!hasVIfDirective) {
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
  return node.openingElement.attributes.some(attr => {
    if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
      return ['v-if', 'v-else-if', 'v-else'].includes(attr.name.name)
    }
    return false
  })
}

/**
 * 验证 v-if 链的合法性
 */
function validateVIfChain(children: t.JSXElement[]): void {
  if (children.length === 0) return

  // 第一个元素必须是 v-if
  const firstChild = children[0]
  if (!hasDirective(firstChild, 'v-if')) {
    throw createError('E008', firstChild, 'IfBlock first child must have v-if directive')
  }

  // 验证后续元素
  for (let i = 1; i < children.length; i++) {
    const child = children[i]
    const prevChild = children[i - 1]

    const hasVElseIf = hasDirective(child, 'v-else-if')
    const hasVElse = hasDirective(child, 'v-else')

    if (!hasVElseIf && !hasVElse) {
      throw createError(
        'E008',
        child,
        'IfBlock children after the first must have v-else-if or v-else directive'
      )
    }

    // v-else 必须是最后一个
    if (hasVElse && i !== children.length - 1) {
      throw createError('E008', child, 'v-else must be the last element in IfBlock')
    }

    // v-else-if 前面不能是 v-else
    if (hasVElseIf && hasDirective(prevChild, 'v-else')) {
      throw createError('E008', child, 'v-else-if cannot follow v-else')
    }
  }
}

/**
 * 检查元素是否有指定指令
 */
function hasDirective(node: t.JSXElement, directiveName: string): boolean {
  return node.openingElement.attributes.some(attr => {
    if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
      return attr.name.name === directiveName
    }
    return false
  })
}
