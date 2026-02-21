/**
 * v-if 链处理工具模块
 * 统一处理 v-if/v-else-if/v-else 链的验证和收集
 * @module utils/vif-helpers
 */
import * as t from '@babel/types'
import { createError } from '../error'
import {
  isJSXElement,
  isJSXText,
  isWhitespaceJSXText,
  isVIf,
  isVElseIf,
  isVElse,
  isVIfChain,
  getDirectiveValue,
  hasDirective
} from './index'

/**
 * v-if 链信息
 */
export interface VIfChainInfo {
  /** 链中的元素节点 */
  nodes: t.JSXElement[]
  /** 条件表达式数组 */
  conditions: t.Expression[]
}

/**
 * 验证 v-if 链的合法性
 * @param children - 子元素数组
 * @throws 如果验证失败
 */
export function validateVIfChain(children: t.JSXElement[]): void {
  if (children.length === 0) return

  // 第一个元素必须是 v-if
  const firstChild = children[0]
  if (!hasDirective(firstChild, 'v-if')) {
    throw createError('E008', firstChild, 'First element must have v-if directive')
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
        'Elements after v-if must have v-else-if or v-else directive'
      )
    }

    // v-else 必须是最后一个
    if (hasVElse && i !== children.length - 1) {
      throw createError('E008', child, 'v-else must be the last element')
    }

    // v-else-if 前面不能是 v-else
    if (hasVElseIf && hasDirective(prevChild, 'v-else')) {
      throw createError('E008', child, 'v-else-if cannot follow v-else')
    }
  }
}

/**
 * 从 JSX 元素数组收集 v-if 链信息
 * @param nodes - JSX 元素数组
 * @returns v-if 链信息
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

  return { nodes, conditions }
}

/**
 * 过滤非空白子元素
 * @param children - 子元素数组
 * @returns 非空白子元素数组
 */
export function filterNonWhitespaceChildren(children: t.Node[]): t.Node[] {
  return children.filter(c => !isJSXText(c) || !isWhitespaceJSXText(c))
}

/**
 * 检查元素是否为有效的 v-if 链元素
 * @param node - AST 节点
 * @returns 是否为有效的 v-if 链元素
 */
export function isValidVIfChainElement(node: t.Node): node is t.JSXElement {
  if (!isJSXElement(node)) return false
  return isVIfChain(node)
}

/**
 * 从 Fragment 收集单个 v-if 链
 */
function collectSingleChainFromFragment(children: t.Node[], startIndex: number): VIfChainInfo {
  const nodes: t.JSXElement[] = [children[startIndex] as t.JSXElement]
  const conditions: t.Expression[] = [getDirectiveValue(nodes[0], 'v-if')!]

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

  return { nodes, conditions }
}

/**
 * 收集 Fragment 中的 v-if 链
 * @param children - Fragment 子元素
 * @returns v-if 链数组和每个链的结束索引
 */
export function collectFragmentVIfChains(children: t.Node[]): Array<VIfChainInfo & { endIndex: number }> {
  const chains: Array<VIfChainInfo & { endIndex: number }> = []
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
      const chain = collectSingleChainFromFragment(children, i)
      // 计算结束索引：跳过空白文本和链元素
      let endIndex = i
      let nodeIdx = 0
      while (endIndex < children.length && nodeIdx < chain.nodes.length) {
        const c = children[endIndex]
        if (isJSXElement(c) && c === chain.nodes[nodeIdx]) {
          nodeIdx++
        }
        endIndex++
      }
      chains.push({ ...chain, endIndex: endIndex - 1 })
      i = endIndex
    } else if (isVElseIf(child) || isVElse(child)) {
      // 孤立的 v-else-if 或 v-else
      throw createError(isVElse(child) ? 'E003' : 'E004', child)
    } else {
      i++
    }
  }

  return chains
}
