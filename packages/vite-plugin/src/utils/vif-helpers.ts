/**
 * v-if 链处理工具模块
 * 统一处理 v-if/v-else-if/v-else 链的验证和收集
 * @module utils/vif-helpers
 */
import * as t from '@babel/types'
import { isJSXElement, isJSXText } from '@babel/types'
import { createError } from '../error.js'
import { isWhitespaceJSXText } from './ast-guards.js'
import {
  getDirectiveValue,
  hasDirective,
  isVElse,
  isVElseIf,
  isVIf,
  isVIfChain
} from './jsx-helpers.js'

/**
 * v-if 链信息
 */
export interface VIfChainInfo {
  /** 链中的元素节点 */
  nodes: t.JSXElement[]
  /** 条件表达式数组 */
  conditions: t.Expression[]
  /** 结束索引 */
  endIndex: number
}

/**
 * 验证 v-if 链的合法性
 */
export function validateVIfChain(children: t.JSXElement[]): void {
  if (children.length === 0) return

  if (!hasDirective(children[0], 'v-if')) {
    throw createError('E008', children[0], 'First element must have v-if directive')
  }

  for (let i = 1; i < children.length; i++) {
    const child = children[i]
    const prevChild = children[i - 1]

    const hasVElseIf = hasDirective(child, 'v-else-if')
    const hasVElse = hasDirective(child, 'v-else')

    if (!hasVElseIf && !hasVElse) {
      throw createError(
        'E008',
        child,
        'Elements after v-if must have v-else-if or v-else directive'
      )
    }

    if (hasVElse && i !== children.length - 1) {
      throw createError('E008', child, 'v-else must be the last element')
    }

    if (hasVElseIf && hasDirective(prevChild, 'v-else')) {
      throw createError('E008', child, 'v-else-if cannot follow v-else')
    }
  }
}

/**
 * 从 JSX 元素数组收集 v-if 链信息
 */
export function collectVIfChainInfo(nodes: t.JSXElement[]): VIfChainInfo {
  const conditions: t.Expression[] = []

  for (const node of nodes) {
    const vIfValue = getDirectiveValue(node, 'v-if')
    if (vIfValue) {
      conditions.push(vIfValue)
      continue
    }

    const vElseIfValue = getDirectiveValue(node, 'v-else-if')
    if (vElseIfValue) {
      conditions.push(vElseIfValue)
      continue
    }

    if (hasDirective(node, 'v-else')) {
      conditions.push(t.booleanLiteral(true))
      continue
    }

    throw createError('E008', node, 'Element missing v-if/v-else-if/v-else directive')
  }

  return { nodes, conditions, endIndex: nodes.length - 1 }
}

/**
 * 收集 Fragment 中的 v-if 链
 */
export function collectFragmentVIfChains(
  children: t.Node[]
): Array<VIfChainInfo & { endIndex: number }> {
  const chains: Array<VIfChainInfo & { endIndex: number }> = []
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
      const chain = collectSingleChainFromFragment(children, i)
      chains.push(chain)
      i = chain.endIndex + 1
    } else if (isVElseIf(child) || isVElse(child)) {
      throw createError(isVElse(child) ? 'E003' : 'E004', child)
    } else {
      i++
    }
  }

  return chains
}

/**
 * 从 Fragment 收集单个 v-if 链
 */
function collectSingleChainFromFragment(
  children: t.Node[],
  startIndex: number
): VIfChainInfo & { endIndex: number } {
  const nodes: t.JSXElement[] = [children[startIndex] as t.JSXElement]
  const conditions: t.Expression[] = [getDirectiveValue(nodes[0], 'v-if')!]

  let j = startIndex + 1
  while (j < children.length) {
    const nextChild = children[j]

    if (isJSXText(nextChild) && isWhitespaceJSXText(nextChild)) {
      j++
      continue
    }

    if (!isJSXElement(nextChild)) break
    if (!isVIfChain(nextChild)) break

    if (isVElseIf(nextChild)) {
      nodes.push(nextChild)
      conditions.push(getDirectiveValue(nextChild, 'v-else-if')!)
      j++
    } else if (isVElse(nextChild)) {
      nodes.push(nextChild)
      conditions.push(t.booleanLiteral(true))
      j++
      break
    } else {
      break
    }
  }

  return { nodes, conditions, endIndex: j - 1 }
}
