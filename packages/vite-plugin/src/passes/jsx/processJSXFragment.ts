/**
 * JSX Fragment 处理模块
 * 将 JSX Fragment 转换为 createView(Fragment, ...) 调用
 * @module passes/jsx/processJSXFragment
 */
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { TransformContext } from '../../context.js'
import {
  addPureComment,
  createCreateViewCall,
  createLocationObject,
  filterWhitespaceChildren,
  getAlias
} from '../../utils/index.js'
import { processChildren } from './processChildren.js'

/**
 * 处理 JSX Fragment
 * @param path - JSX Fragment 路径
 * @param ctx - 转换上下文
 */
export function processJSXFragment(path: NodePath<t.JSXFragment>, ctx: TransformContext): void {
  const node = path.node

  // 过滤空白子节点
  const children = filterWhitespaceChildren(node.children)

  // 标记需要的导入
  ctx.imports.Fragment = true
  ctx.imports.createView = true

  const fragmentAlias = getAlias(ctx.vitarxAliases, 'Fragment')
  const createViewAlias = getAlias(ctx.vitarxAliases, 'createView')
  const locInfo = ctx.options.dev && node.loc ? createLocationObject(ctx.filename, node.loc) : null

  // 无子元素
  if (children.length === 0) {
    const viewCall = addPureComment(
      createCreateViewCall(t.identifier(fragmentAlias), null, locInfo, createViewAlias)
    )
    if (node.loc) viewCall.loc = node.loc
    path.replaceWith(viewCall)
    return
  }

  // 处理子元素
  const processedChildren = processChildren(children, ctx)
  const childrenValue =
    processedChildren.length === 1 ? processedChildren[0] : t.arrayExpression(processedChildren)

  const props = t.objectExpression([t.objectProperty(t.identifier('children'), childrenValue)])

  const viewCall = addPureComment(
    createCreateViewCall(t.identifier(fragmentAlias), props, locInfo, createViewAlias)
  )
  if (node.loc) viewCall.loc = node.loc
  path.replaceWith(viewCall)
}
