/**
 * JSX Fragment 处理模块
 * 将 JSX Fragment 转换为 createView(Fragment, ...) 调用
 * @module passes/jsx/processJSXFragment
 */
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { isJSXElement, isJSXExpressionContainer, isJSXFragment, isJSXText } from '@babel/types'
import { markImport, TransformContext } from '../../context'
import {
  addPureComment,
  createCreateViewCall,
  createLocationObject,
  getAlias
} from '../../utils/index.js'

/**
 * 处理 JSX Fragment
 * @param path - JSX Fragment 路径
 * @param ctx - 转换上下文
 */
export function processJSXFragment(path: NodePath<t.JSXFragment>, ctx: TransformContext): void {
  const node = path.node
  const processedChildren = collectFragmentChildren(node.children)

  markImport(ctx, 'Fragment')
  markImport(ctx, 'createView')

  const fragmentAlias = getAlias(ctx.vitarxAliases, 'Fragment')
  const createViewAlias = getAlias(ctx.vitarxAliases, 'createView')
  const locInfo = ctx.options.dev && node.loc ? createLocationObject(ctx.filename, node.loc) : null

  // 无子元素
  if (processedChildren.length === 0) {
    const viewCall = addPureComment(
      createCreateViewCall(t.identifier(fragmentAlias), null, locInfo, createViewAlias)
    )
    if (node.loc) viewCall.loc = node.loc
    path.replaceWith(viewCall)
    return
  }

  // 有子元素
  const childrenValue =
    processedChildren.length === 1 ? processedChildren[0] : t.arrayExpression(processedChildren)

  const props = t.objectExpression([t.objectProperty(t.identifier('children'), childrenValue)])

  const viewCall = addPureComment(
    createCreateViewCall(t.identifier(fragmentAlias), props, locInfo, createViewAlias)
  )
  if (node.loc) viewCall.loc = node.loc
  path.replaceWith(viewCall)
}

/**
 * 收集 Fragment 子元素
 */
function collectFragmentChildren(children: t.Node[]): t.Expression[] {
  const result: t.Expression[] = []

  for (const child of children) {
    // 文本节点
    if (isJSXText(child)) {
      const trimmed = child.value.trim()
      if (trimmed) {
        result.push(t.stringLiteral(trimmed))
      }
      continue
    }

    // 表达式容器
    if (isJSXExpressionContainer(child)) {
      if (child.expression.type === 'JSXEmptyExpression') continue
      result.push(child.expression as t.Expression)
      continue
    }

    // 展开子元素
    if (child.type === 'JSXSpreadChild') {
      result.push(child.expression)
      continue
    }

    // JSX 元素或片段
    if (isJSXElement(child) || isJSXFragment(child)) {
      result.push(child as t.Expression)
      continue
    }

    result.push(child as t.Expression)
  }

  return result
}
