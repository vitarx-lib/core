/**
 * AST 类型守卫函数
 * 用于判断节点类型
 * @module utils/ast-guards
 */
import { isJSXText, type Node } from '@babel/types'

/**
 * 判断 JSXText 是否为纯空白文本
 * @param node - AST 节点
 * @returns 是否为纯空白文本
 */
export function isWhitespaceJSXText(node: Node): boolean {
  if (!isJSXText(node)) return false
  return /^\s*$/.test(node.value)
}
