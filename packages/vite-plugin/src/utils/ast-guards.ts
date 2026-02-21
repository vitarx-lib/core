/**
 * AST 类型守卫函数
 * 用于判断节点类型
 * @module utils/ast-guards
 */
import type {
  Node,
  JSXElement,
  JSXFragment,
  JSXText,
  JSXExpressionContainer,
  JSXEmptyExpression,
  Identifier,
  MemberExpression,
  ConditionalExpression,
  LogicalExpression,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
} from '@babel/types'

/**
 * 判断节点是否为 JSXElement
 * @param node - AST 节点
 * @returns 是否为 JSXElement
 */
export function isJSXElement(node: Node): node is JSXElement {
  return node.type === 'JSXElement'
}

/**
 * 判断节点是否为 JSXFragment
 * @param node - AST 节点
 * @returns 是否为 JSXFragment
 */
export function isJSXFragment(node: Node): node is JSXFragment {
  return node.type === 'JSXFragment'
}

/**
 * 判断节点是否为 JSXText
 * @param node - AST 节点
 * @returns 是否为 JSXText
 */
export function isJSXText(node: Node): node is JSXText {
  return node.type === 'JSXText'
}

/**
 * 判断节点是否为 JSXExpressionContainer
 * @param node - AST 节点
 * @returns 是否为 JSXExpressionContainer
 */
export function isJSXExpressionContainer(node: Node): node is JSXExpressionContainer {
  return node.type === 'JSXExpressionContainer'
}

/**
 * 判断节点是否为 JSXEmptyExpression
 * @param node - AST 节点
 * @returns 是否为 JSXEmptyExpression
 */
export function isJSXEmptyExpression(node: Node): node is JSXEmptyExpression {
  return node.type === 'JSXEmptyExpression'
}

/**
 * 判断节点是否为 Identifier
 * @param node - AST 节点
 * @returns 是否为 Identifier
 */
export function isIdentifier(node: Node): node is Identifier {
  return node.type === 'Identifier'
}

/**
 * 判断节点是否为 MemberExpression
 * @param node - AST 节点
 * @returns 是否为 MemberExpression
 */
export function isMemberExpression(node: Node): node is MemberExpression {
  return node.type === 'MemberExpression'
}

/**
 * 判断节点是否为 ConditionalExpression
 * @param node - AST 节点
 * @returns 是否为 ConditionalExpression
 */
export function isConditionalExpression(node: Node): node is ConditionalExpression {
  return node.type === 'ConditionalExpression'
}

/**
 * 判断节点是否为 LogicalExpression
 * @param node - AST 节点
 * @returns 是否为 LogicalExpression
 */
export function isLogicalExpression(node: Node): node is LogicalExpression {
  return node.type === 'LogicalExpression'
}

/**
 * 判断节点是否为 StringLiteral
 * @param node - AST 节点
 * @returns 是否为 StringLiteral
 */
export function isStringLiteral(node: Node): node is StringLiteral {
  return node.type === 'StringLiteral'
}

/**
 * 判断节点是否为 NumericLiteral
 * @param node - AST 节点
 * @returns 是否为 NumericLiteral
 */
export function isNumericLiteral(node: Node): node is NumericLiteral {
  return node.type === 'NumericLiteral'
}

/**
 * 判断节点是否为 BooleanLiteral
 * @param node - AST 节点
 * @returns 是否为 BooleanLiteral
 */
export function isBooleanLiteral(node: Node): node is BooleanLiteral {
  return node.type === 'BooleanLiteral'
}

/**
 * 判断 JSXText 是否为纯空白文本
 * @param node - AST 节点
 * @returns 是否为纯空白文本
 */
export function isWhitespaceJSXText(node: Node): boolean {
  if (!isJSXText(node)) return false
  return /^\s*$/.test(node.value)
}
