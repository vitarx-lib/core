/**
 * AST 节点构建函数
 * @module utils/ast-builders
 */
import * as t from '@babel/types'
import {
  type ArrowFunctionExpression,
  type CallExpression,
  type Expression,
  isIdentifier,
  isStringLiteral,
  type ObjectExpression,
  type SourceLocation
} from '@babel/types'
import { PURE_COMMENT } from '../constants'
import type { VitarxImportAliases } from '../context'

/** 用于追踪已添加 PURE 注释的节点 */
const pureCommentedNodes = new WeakSet<CallExpression>()

/**
 * 创建 unref 调用
 * @param argument - 参数表达式
 * @param alias - unref 别名
 * @returns CallExpression
 */
export function createUnrefCall(argument: Expression, alias?: string): CallExpression {
  return t.callExpression(t.identifier(alias || 'unref'), [argument])
}

/**
 * 创建 access 调用
 * @param object - 对象表达式
 * @param key - 键表达式
 * @param alias - access 别名
 * @returns CallExpression
 */
export function createAccessCall(
  object: Expression,
  key: Expression,
  alias?: string
): CallExpression {
  let keyArg: Expression
  if (isIdentifier(key)) {
    keyArg = t.stringLiteral(key.name)
  } else if (isStringLiteral(key)) {
    keyArg = key
  } else {
    keyArg = key
  }

  return t.callExpression(t.identifier(alias || 'access'), [object, keyArg])
}

/**
 * 创建 dynamic 调用
 * @param argument - 参数表达式
 * @param alias - dynamic 别名
 * @returns CallExpression
 */
export function createDynamicCall(argument: Expression, alias?: string): CallExpression {
  return t.callExpression(t.identifier(alias || 'dynamic'), [
    t.arrowFunctionExpression([], argument)
  ])
}

/**
 * 创建 branch 调用
 * @param condition - 条件函数
 * @param branches - 分支函数数组
 * @param alias - branch 别名
 * @returns CallExpression
 */
export function createBranchCall(
  condition: ArrowFunctionExpression,
  branches: ArrowFunctionExpression[],
  alias?: string
): CallExpression {
  return t.callExpression(t.identifier(alias || 'branch'), [condition, t.arrayExpression(branches)])
}

/**
 * 创建 createView 调用
 * @param type - 元素类型
 * @param props - props 对象
 * @param locInfo - 位置信息对象
 * @param alias - createView 别名
 * @returns CallExpression
 */
export function createCreateViewCall(
  type: Expression,
  props: ObjectExpression | null,
  locInfo?: ObjectExpression | null,
  alias?: string
): CallExpression {
  const args: Expression[] = [type]

  // props 参数
  if (props) {
    args.push(props)
  } else if (locInfo) {
    // 如果有 locInfo 但没有 props，需要传 null
    args.push(t.nullLiteral())
  }

  // locInfo 参数
  if (locInfo) {
    args.push(locInfo)
  }

  return t.callExpression(t.identifier(alias || 'createView'), args)
}

/**
 * 创建 withDirectives 调用
 * @param view - 视图节点
 * @param directives - 指令数组，每项为 [指令名, 指令值]
 * @param alias - withDirectives 别名
 * @returns CallExpression
 */
export function createWithDirectivesCall(
  view: Expression,
  directives: Array<[string, Expression]>,
  alias?: string
): CallExpression {
  const directiveArray = directives.map(([name, value]) => {
    return t.arrayExpression([t.stringLiteral(name), value])
  })

  return t.callExpression(t.identifier(alias || 'withDirectives'), [
    view,
    t.arrayExpression(directiveArray)
  ])
}

/**
 * 创建箭头函数
 * @param body - 函数体表达式
 * @returns ArrowFunctionExpression
 */
export function createArrowFunction(body: Expression): ArrowFunctionExpression {
  return t.arrowFunctionExpression([], body)
}

/**
 * 创建位置信息对象
 * @param filename - 文件名
 * @param loc - 源码位置
 * @returns ObjectExpression
 */
export function createLocationObject(filename: string, loc: SourceLocation): ObjectExpression {
  return t.objectExpression([
    t.objectProperty(t.identifier('fileName'), t.stringLiteral(filename)),
    t.objectProperty(t.identifier('lineNumber'), t.numericLiteral(loc.start.line)),
    t.objectProperty(t.identifier('columnNumber'), t.numericLiteral(loc.start.column + 1))
  ])
}

/**
 * 为调用表达式添加 @__PURE__ 注释
 * @param node - 调用表达式节点
 * @returns 添加注释后的节点
 */
export function addPureComment<T extends CallExpression>(node: T): T {
  if (pureCommentedNodes.has(node)) {
    return node
  }
  pureCommentedNodes.add(node)
  t.addComment(node, 'leading', ` ${PURE_COMMENT} `, false)
  return node
}

/**
 * 获取 API 别名
 * @param aliases - 别名映射
 * @param name - API 名称
 * @returns 别名或原名
 */
export function getAlias(aliases: VitarxImportAliases, name: keyof VitarxImportAliases): string {
  return aliases[name] || name
}
