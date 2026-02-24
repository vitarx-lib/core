/**
 * v-model 指令处理模块
 * 负责处理 JSX 元素的 v-model 双向绑定指令
 * @module passes/props/vmodel
 */
import * as t from '@babel/types'
import { isIdentifier, isMemberExpression } from '@babel/types'
import { markImport, TransformContext } from '../../context'
import { createError } from '../../error'
import { getAlias } from '../../utils/index.js'
import type { VModelState } from './types'

/**
 * 从属性列表中提取 v-model 状态
 * @param attributes - JSX 元素属性列表
 * @returns v-model 状态对象
 */
export function extractVModelState(
  attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[]
): VModelState {
  for (const attr of attributes) {
    if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
      if (attr.name.name === 'v-model') {
        const value =
          attr.value?.type === 'JSXExpressionContainer'
            ? (attr.value.expression as t.Expression)
            : null
        return { hasVModel: true, value, node: attr }
      }
    }
  }
  return { hasVModel: false, value: null, node: null }
}

/**
 * 创建 v-model 相关的 props
 * 生成 modelValue getter 和 onUpdate:modelValue 回调
 * @param value - v-model 绑定的值表达式
 * @param attrNode - v-model 属性节点（用于错误定位）
 * @param existingPropNames - 已存在的属性名集合（用于冲突检测）
 * @param node - JSX 元素节点
 * @param ctx - 转换上下文
 * @returns 包含 modelValue 和 onUpdate:modelValue 的属性数组
 * @throws {Error} E009 - 当 modelValue 或 onUpdate:modelValue 已存在时
 * @throws {Error} E010 - 当 v-model 绑定值不是 Identifier 或 MemberExpression 时
 */
export function createVModelProps(
  value: t.Expression,
  attrNode: t.JSXAttribute | null,
  existingPropNames: Set<string>,
  node: t.JSXElement,
  ctx: TransformContext
): (t.ObjectMethod | t.ObjectProperty)[] {
  // 检查属性名冲突
  if (existingPropNames.has('modelValue') || existingPropNames.has('onUpdate:modelValue')) {
    throw createError('E009', attrNode || node)
  }

  // v-model 只支持 Identifier 和 MemberExpression
  if (!isIdentifier(value) && !isMemberExpression(value)) {
    throw createError('E010', attrNode || node)
  }

  // Identifier: 可能是 ref 变量
  if (isIdentifier(value)) {
    return createIdentifierVModelProps(value, attrNode || node, ctx)
  }

  // MemberExpression: 直接访问属性
  return createMemberExpressionVModelProps(value)
}

/**
 * 为 Identifier 类型的 v-model 值创建 props
 * 支持已知 ref 变量和未知变量两种情况
 * @param value - Identifier 值
 * @param node - AST 节点（用于错误定位）
 * @param ctx - 转换上下文
 * @returns 属性数组
 */
function createIdentifierVModelProps(
  value: t.Identifier,
  node: t.Node,
  ctx: TransformContext
): (t.ObjectMethod | t.ObjectProperty)[] {
  const isKnownRef = ctx.refVariables.has(value.name)

  // 已知 ref 变量：直接访问 .value
  if (isKnownRef) {
    return [
      // modelValue getter: 返回 value.value
      t.objectMethod(
        'get',
        t.identifier('modelValue'),
        [],
        t.blockStatement([t.returnStatement(t.memberExpression(value, t.identifier('value')))])
      ),
      // onUpdate:modelValue: v => value.value = v
      t.objectProperty(
        t.stringLiteral('onUpdate:modelValue'),
        t.arrowFunctionExpression(
          [t.identifier('v')],
          t.assignmentExpression(
            '=',
            t.memberExpression(value, t.identifier('value')),
            t.identifier('v')
          )
        )
      )
    ]
  }

  // 未知变量：使用 unref 进行解包
  markImport(ctx, 'unref')
  const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')

  const updateBody: t.Statement[] = []

  // 开发模式：添加 isRef 检查
  if (ctx.options.dev) {
    markImport(ctx, 'isRef')
    const isRefAlias = getAlias(ctx.vitarxAliases, 'isRef')
    const locInfo = node.loc
      ? ` at ${ctx.filename}:${node.loc.start.line}:${node.loc.start.column + 1}`
      : ''
    updateBody.push(
      t.ifStatement(
        t.unaryExpression('!', t.callExpression(t.identifier(isRefAlias), [value])),
        t.blockStatement([
          t.throwStatement(
            t.newExpression(t.identifier('Error'), [
              t.stringLiteral(`[v-model] Identifier must be a ref. Invalid usage${locInfo}`)
            ])
          )
        ])
      )
    )
  }

  // 更新逻辑：value.value = v
  updateBody.push(
    t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(value, t.identifier('value')),
        t.identifier('v')
      )
    )
  )

  return [
    // modelValue getter: 返回 unref(value)
    t.objectMethod(
      'get',
      t.identifier('modelValue'),
      [],
      t.blockStatement([t.returnStatement(t.callExpression(t.identifier(unrefAlias), [value]))])
    ),
    // onUpdate:modelValue: v => { [isRef检查]; value.value = v }
    t.objectProperty(
      t.stringLiteral('onUpdate:modelValue'),
      t.arrowFunctionExpression([t.identifier('v')], t.blockStatement(updateBody))
    )
  ]
}

/**
 * 为 MemberExpression 类型的 v-model 值创建 props
 * 直接访问对象属性，无需 ref 处理
 * @param value - MemberExpression 值
 * @returns 属性数组
 */
function createMemberExpressionVModelProps(
  value: t.MemberExpression
): (t.ObjectMethod | t.ObjectProperty)[] {
  return [
    // modelValue getter: 直接返回表达式
    t.objectMethod(
      'get',
      t.identifier('modelValue'),
      [],
      t.blockStatement([t.returnStatement(value)])
    ),
    // onUpdate:modelValue: v => obj.prop = v
    t.objectProperty(
      t.stringLiteral('onUpdate:modelValue'),
      t.arrowFunctionExpression(
        [t.identifier('v')],
        t.assignmentExpression('=', value, t.identifier('v'))
      )
    )
  ]
}
