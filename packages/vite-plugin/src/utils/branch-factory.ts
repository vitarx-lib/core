/**
 * Branch 调用工厂模块
 * 统一处理条件分支的生成
 * @module utils/branch-factory
 */
import * as t from '@babel/types'
import type { TransformContext } from '../context'
import { markImport } from '../context'
import {
  addPureComment,
  createArrowFunction,
  createBranchCall,
  createUnrefCall,
  getAlias,
  isBooleanLiteral,
  isIdentifier
} from './index'

/**
 * 条件分支配置
 */
export interface BranchConfig {
  /** 条件表达式数组 */
  conditions: t.Expression[]
  /** 分支函数数组 */
  branches: t.ArrowFunctionExpression[]
  /** 是否使用 unref 包装标识符条件 */
  useRef?: boolean
}

/**
 * 创建 branch 调用
 * @param config - 分支配置
 * @param ctx - 转换上下文
 * @returns branch 调用表达式
 */
export function createBranch(config: BranchConfig, ctx: TransformContext): t.CallExpression {
  const { conditions, branches, useRef = true } = config

  markImport(ctx, 'branch')
  if (useRef) {
    markImport(ctx, 'unref')
  }

  const conditionExpr = buildNestedCondition(conditions, ctx, useRef)
  const branchAlias = getAlias(ctx.vitarxAliases, 'branch')

  return addPureComment(createBranchCall(createArrowFunction(conditionExpr), branches, branchAlias))
}

/**
 * 构建嵌套条件表达式
 * 从后向前构建三元表达式链
 */
export function buildNestedCondition(
  conditions: t.Expression[],
  ctx: TransformContext,
  useRef: boolean = true
): t.Expression {
  if (conditions.length === 0) {
    return t.nullLiteral()
  }

  const unrefAlias = useRef ? getAlias(ctx.vitarxAliases, 'unref') : ''
  let result: t.Expression | null = null
  const lastIndex = conditions.length - 1

  for (let i = lastIndex; i >= 0; i--) {
    const condition = conditions[i]

    // v-else 的情况（布尔 true）
    if (isBooleanLiteral(condition) && condition.value) {
      result = t.numericLiteral(i)
      continue
    }

    // 构建条件表达式
    const conditionExpr =
      useRef && isIdentifier(condition) ? createUnrefCall(condition, unrefAlias) : condition

    if (result === null) {
      result = t.conditionalExpression(conditionExpr, t.numericLiteral(i), t.nullLiteral())
    } else {
      result = t.conditionalExpression(conditionExpr, t.numericLiteral(i), result)
    }
  }

  return result || t.nullLiteral()
}

/**
 * 从条件数组和分支节点创建完整的 branch 调用
 * @param conditions - 条件表达式数组
 * @param branchNodes - 分支节点数组（会被包装为箭头函数）
 * @param ctx - 转换上下文
 * @returns branch 调用表达式
 */
export function createBranchFromNodes(
  conditions: t.Expression[],
  branchNodes: t.Expression[],
  ctx: TransformContext
): t.CallExpression {
  const branches = branchNodes.map(node => createArrowFunction(node))
  return createBranch({ conditions, branches, useRef: true }, ctx)
}

/**
 * 创建简单的二元条件 branch（用于三元表达式）
 * @param condition - 条件表达式
 * @param consequent - 真值分支
 * @param alternate - 假值分支
 * @param ctx - 转换上下文
 * @returns branch 调用表达式
 */
export function createBinaryBranch(
  condition: t.Expression,
  consequent: t.Expression,
  alternate: t.Expression,
  ctx: TransformContext
): t.CallExpression {
  const conditions = [condition, t.booleanLiteral(true)]
  const branches = [createArrowFunction(consequent), createArrowFunction(alternate)]

  // 只有条件是 Identifier 时才需要 unref
  const useRef = isIdentifier(condition)
  return createBranch({ conditions, branches, useRef }, ctx)
}
