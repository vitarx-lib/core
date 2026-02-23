/**
 * JSX 元素处理模块
 * 将 JSX 元素转换为 createView 调用
 * @module passes/jsx/processJSXElement
 */
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { isJSXExpressionContainer, isJSXText } from '@babel/types'
import { markImport, TransformContext } from '../../context'
import { createError } from '../../error'
import {
  addPureComment,
  createArrowFunction,
  createBranch,
  createCreateViewCall,
  createLocationObject,
  getAlias,
  getDirectiveValue,
  getJSXElementName,
  isNativeElement,
  isVElse,
  isVIf,
  isVIfChain,
  removeVDirectives
} from '../../utils/index.js'
import { processDirectives } from '../directives'
import { processProps } from '../props'
import { processChildren } from './processChildren'

/**
 * 处理 JSX 元素
 * @param path - JSX 元素路径
 * @param ctx - 转换上下文
 */
export function processJSXElement(path: NodePath<t.JSXElement>, ctx: TransformContext): void {
  const result = transformJSXElement(path.node, ctx, true)
  if (result) {
    path.replaceWith(result)
  }
}

/**
 * 转换 JSX 元素为表达式
 * @param node - JSX 元素节点
 * @param ctx - 转换上下文
 * @param handleVIf - 是否处理 v-if 指令
 * @returns 转换后的表达式
 */
export function transformJSXElement(
  node: t.JSXElement,
  ctx: TransformContext,
  handleVIf: boolean = false
): t.Expression | null {
  const name = getJSXElementName(node)
  if (!name) return null

  // 处理 v-if 链
  if (handleVIf && isVIfChain(node)) {
    if (isVIf(node)) {
      return transformSingleVIf(node, ctx)
    } else {
      throw createError(isVElse(node) ? 'E003' : 'E004', node)
    }
  }

  // 确定元素类型
  const type = isNativeElement(name) ? t.stringLiteral(name) : t.identifier(name)

  // 处理属性
  const { props, directives } = processProps(node, ctx)

  // 处理子元素
  const finalProps = processElementChildren(node, props, ctx)

  // 生成 createView 调用
  markImport(ctx, 'createView')
  const createViewAlias = getAlias(ctx.vitarxAliases, 'createView')
  const locInfo = ctx.options.dev && node.loc ? createLocationObject(ctx.filename, node.loc) : null

  let viewCall = createCreateViewCall(type, finalProps, locInfo, createViewAlias)

  // 处理指令
  if (directives.size > 0) {
    viewCall = processDirectives(viewCall, directives, ctx)
  } else {
    viewCall = addPureComment(viewCall)
  }

  if (node.loc) {
    viewCall.loc = node.loc
  }

  return viewCall
}

/**
 * 处理元素的子元素
 */
function processElementChildren(
  node: t.JSXElement,
  props: t.ObjectExpression | null,
  ctx: TransformContext
): t.ObjectExpression | null {
  // 过滤有效子元素
  const children = node.children.filter(child => {
    if (isJSXText(child)) {
      return child.value.trim().length > 0
    }
    if (isJSXExpressionContainer(child)) {
      return child.expression.type !== 'JSXEmptyExpression'
    }
    return true
  })

  if (children.length === 0) {
    return props
  }

  // 处理子元素
  const processedChildren = processChildren(children, ctx)
  const childrenValue =
    processedChildren.length === 1 ? processedChildren[0] : t.arrayExpression(processedChildren)

  // 添加 children 属性
  if (props) {
    props.properties.push(t.objectProperty(t.identifier('children'), childrenValue))
    return props
  }

  return t.objectExpression([t.objectProperty(t.identifier('children'), childrenValue)])
}

/**
 * 转换单个 v-if 元素
 */
function transformSingleVIf(node: t.JSXElement, ctx: TransformContext): t.CallExpression | null {
  if (!isVIf(node)) return null

  const condition = getDirectiveValue(node, 'v-if')
  if (!condition) return null

  // 移除 v- 指令
  removeVDirectives(node)

  // 转换元素
  const transformedNode = transformJSXElement(node, ctx, false)
  if (!transformedNode) return null

  // 生成 branch 调用
  const branchCall = createBranch(
    { conditions: [condition], branches: [createArrowFunction(transformedNode)] },
    ctx
  )

  if (node.loc) {
    branchCall.loc = node.loc
  }

  return branchCall
}
