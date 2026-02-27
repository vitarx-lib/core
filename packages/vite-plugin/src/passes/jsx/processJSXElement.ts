/**
 * JSX 元素处理模块
 * 将 JSX 元素转换为 createView 调用
 * @module passes/jsx/processJSXElement
 */
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { isJSXElement, isJSXExpressionContainer, isJSXText } from '@babel/types'
import { addWarning, markImport, TransformContext } from '../../context.js'
import { createError, createWarning } from '../../error.js'
import {
  addPureComment,
  createArrowFunction,
  createBranch,
  createCreateViewCall,
  createLocationObject,
  getAlias,
  getDirectiveValue,
  getJSXAttributeByName,
  getJSXElementName,
  isNativeElement,
  isVElse,
  isVIf,
  isVIfChain,
  removeVDirectives
} from '../../utils/index.js'
import { processDirectives } from '../directives/index.js'
import { processProps } from '../props/index.js'
import { processChildren } from './processChildren.js'

/**
 * 处理 JSX 元素
 * @param path - JSX 元素路径
 * @param ctx - 转换上下文
 */
export function processJSXElement(path: NodePath<t.JSXElement>, ctx: TransformContext): void {
  const name = getJSXElementName(path.node)

  // 校验 Match 必须在 Switch 内使用
  if (name === 'Match') {
    validateMatchInSwitch(path)
  }

  const result = transformJSXElement(path.node, ctx, true)
  if (result) {
    path.replaceWith(result)
  }
}

/**
 * 校验 Match 组件必须在 Switch 内使用
 */
function validateMatchInSwitch(path: NodePath<t.JSXElement>): void {
  const parent = path.parentPath
  if (!parent) {
    throw createError('E012', path.node)
  }

  // 检查父元素是否是 Switch
  if (parent.node.type === 'JSXElement') {
    const parentName = getJSXElementName(parent.node)
    if (parentName === 'Switch') {
      return
    }
  }

  // 检查是否在 Fragment 内且 Fragment 的父元素是 Switch
  if (parent.node.type === 'JSXFragment' || parent.node.type === 'JSXElement') {
    const grandParent = parent.parentPath
    if (grandParent?.node.type === 'JSXElement') {
      const grandParentName = getJSXElementName(grandParent.node)
      if (grandParentName === 'Switch') {
        return
      }
    }
  }

  throw createError('E012', path.node)
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

  // 检测是否有有效子元素
  const hasChildren = node.children.some(child => {
    if (isJSXText(child)) {
      return child.value.trim().length > 0
    }
    if (isJSXExpressionContainer(child)) {
      return child.expression.type !== 'JSXEmptyExpression'
    }
    return true
  })

  // 处理属性（有子元素时跳过 children 属性）
  const { props, directives } = processProps(node, ctx, hasChildren)

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
 * 子元素优先于 children 属性，同时发出警告
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

  // 检查是否存在 children 属性
  const childrenAttr = getJSXAttributeByName(node, 'children')
  if (childrenAttr) {
    // 发出警告：children 属性和子元素同时存在
    addWarning(ctx, createWarning('W001', childrenAttr))
  }

  // 校验 Match 组件必须在 Switch 内使用
  // 当前元素不是 Switch 时，检查子元素中是否有 Match
  const currentName = getJSXElementName(node)
  if (currentName !== 'Switch') {
    for (const child of children) {
      if (isJSXElement(child)) {
        const childName = getJSXElementName(child as t.JSXElement)
        if (childName === 'Match') {
          throw createError('E012', child as t.JSXElement)
        }
      }
    }
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
