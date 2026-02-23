/**
 * Props 处理模块
 * 负责处理 JSX 元素的属性，包括 v-model 特殊指令
 * @module passes/props
 */
import * as t from '@babel/types'
import {
  isBooleanLiteral,
  isIdentifier,
  isJSXExpressionContainer,
  isMemberExpression,
  isNumericLiteral,
  isStringLiteral
} from '@babel/types'
import { markImport, TransformContext } from '../../context'
import { createError } from '../../error'
import { getAlias } from '../../utils/index.js'

/**
 * Props 处理结果
 */
export interface PropsResult {
  /** 处理后的 props 对象 */
  props: t.ObjectExpression | null
  /** 指令映射 */
  directives: Map<string, t.Expression>
  /** 是否包含 v-bind */
  hasVBind: boolean
}

/**
 * 处理 JSX 元素的属性
 * @param node - JSX 元素节点
 * @param ctx - 转换上下文
 * @returns 处理结果
 */
export function processProps(node: t.JSXElement, ctx: TransformContext): PropsResult {
  const attributes = node.openingElement.attributes
  const properties: (t.ObjectProperty | t.ObjectMethod | t.SpreadElement)[] = []
  const directives = new Map<string, t.Expression>()
  let hasVBind = false

  // 追踪已存在的属性名（用于 v-model 冲突检测）
  const existingPropNames = new Set<string>()
  // v-model 相关状态
  let vModelState = extractVModelState(attributes)

  for (const attr of attributes) {
    // 处理展开属性 {...props}
    if (attr.type === 'JSXSpreadAttribute') {
      const result = processSpreadAttribute(attr, hasVBind, node)
      if (result) {
        properties.push(result.property)
        hasVBind = result.hasVBind
      }
      continue
    }

    // 处理普通属性
    if (attr.type === 'JSXAttribute') {
      const result = processAttribute(attr, existingPropNames, ctx)
      if (result.type === 'directive') {
        if (result.isVModel) {
          vModelState = { hasVModel: true, value: result.value, node: attr }
        } else if (result.isVBind) {
          properties.push(t.objectProperty(t.stringLiteral('v-bind'), result.value))
          hasVBind = true
        } else {
          directives.set(result.name, result.value)
        }
      } else if (result.type === 'property') {
        properties.push(result.property)
      }
    }
  }

  // 处理 v-model
  if (vModelState.hasVModel && vModelState.value) {
    const vModelProps = createVModelProps(
      vModelState.value,
      vModelState.node,
      existingPropNames,
      node,
      ctx
    )
    properties.push(...vModelProps)
  }

  const props = properties.length > 0 ? t.objectExpression(properties) : null
  return { props, directives, hasVBind }
}

/**
 * v-model 状态
 */
interface VModelState {
  hasVModel: boolean
  value: t.Expression | null
  node: t.JSXAttribute | null
}

/**
 * 从属性中提取 v-model 状态
 */
function extractVModelState(attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[]): VModelState {
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
 * 处理展开属性
 */
function processSpreadAttribute(
  attr: t.JSXSpreadAttribute,
  hasVBind: boolean,
  node: t.JSXElement
): { property: t.ObjectProperty; hasVBind: boolean } | null {
  if (hasVBind) {
    throw createError('E001', node)
  }
  return {
    property: t.objectProperty(t.stringLiteral('v-bind'), attr.argument),
    hasVBind: true
  }
}

/**
 * 属性处理结果类型
 */
type AttributeResult =
  | { type: 'directive'; name: string; value: t.Expression; isVBind: boolean; isVModel: boolean }
  | { type: 'property'; property: t.ObjectProperty | t.ObjectMethod }

/**
 * 处理单个属性
 */
function processAttribute(
  attr: t.JSXAttribute,
  existingPropNames: Set<string>,
  ctx: TransformContext
): AttributeResult {
  const attrName = attr.name

  // 处理命名空间属性 (v:xxx)
  if (attrName.type === 'JSXNamespacedName') {
    return processNamespacedAttribute(attr, attrName, existingPropNames, ctx)
  }

  // 处理标识符属性
  if (attrName.type === 'JSXIdentifier') {
    const name = attrName.name

    // v-bind 指令
    if (name === 'v-bind') {
      const value = getAttributeValue(attr.value)
      return { type: 'directive', name: 'v-bind', value, isVBind: true, isVModel: false }
    }

    // v-model 指令
    if (name === 'v-model') {
      const value = getAttributeValue(attr.value)
      return { type: 'directive', name: 'v-model', value, isVBind: false, isVModel: true }
    }

    // 其他 v- 指令（排除 v-if 系列）
    if (name.startsWith('v-') && !['v-if', 'v-else-if', 'v-else'].includes(name)) {
      const value = getAttributeValue(attr.value)
      return { type: 'directive', name, value, isVBind: false, isVModel: false }
    }

    // 普通属性
    existingPropNames.add(name)
    const value = getAttributeValue(attr.value)
    const property = createProperty(name, value, ctx)
    return { type: 'property', property }
  }

  const value = getAttributeValue(attr.value)
  return { type: 'property', property: t.objectProperty(t.identifier('unknown'), value) }
}

/**
 * 处理命名空间属性
 */
function processNamespacedAttribute(
  attr: t.JSXAttribute,
  attrName: t.JSXNamespacedName,
  existingPropNames: Set<string>,
  ctx: TransformContext
): AttributeResult {
  const namespace = attrName.namespace.name
  const name = attrName.name.name
  const fullName = `${namespace}:${name}`

  // v:xxx 指令
  if (namespace === 'v') {
    const directiveName = `v-${name}`
    const value = getAttributeValue(attr.value)

    // v-bind
    if (directiveName === 'v-bind') {
      return { type: 'directive', name: 'v-bind', value, isVBind: true, isVModel: false }
    }

    // 其他指令
    if (!['v-if', 'v-else-if', 'v-else', 'v-model'].includes(directiveName)) {
      return { type: 'directive', name: directiveName, value, isVBind: false, isVModel: false }
    }
  }

  // 其他命名空间属性作为普通属性
  existingPropNames.add(fullName)
  const value = getAttributeValue(attr.value)
  const property = createProperty(fullName, value, ctx)
  return { type: 'property', property }
}

/**
 * 获取属性值
 */
function getAttributeValue(value: t.JSXAttribute['value']): t.Expression {
  if (!value) {
    return t.booleanLiteral(true)
  }

  if (isStringLiteral(value)) {
    return value
  }

  if (isJSXExpressionContainer(value)) {
    if (value.expression.type === 'JSXEmptyExpression') {
      return t.booleanLiteral(true)
    }
    return value.expression as t.Expression
  }

  return value
}

/**
 * 创建属性节点
 * 静态值直接赋值，动态值生成 getter
 */
function createProperty(
  key: string,
  value: t.Expression,
  ctx: TransformContext
): t.ObjectProperty | t.ObjectMethod {
  // 静态值直接赋值
  if (isStringLiteral(value) || isNumericLiteral(value) || isBooleanLiteral(value)) {
    return t.objectProperty(t.identifier(key), value)
  }

  // Identifier: 检查是否为已知的 ref 变量
  if (isIdentifier(value)) {
    // 已知 ref 变量直接使用 .value
    if (ctx.refVariables.has(value.name)) {
      return t.objectMethod(
        'get',
        t.identifier(key),
        [],
        t.blockStatement([t.returnStatement(t.memberExpression(value, t.identifier('value')))])
      )
    }

    // 未知变量使用 unref
    markImport(ctx, 'unref')
    const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')
    return t.objectMethod(
      'get',
      t.identifier(key),
      [],
      t.blockStatement([t.returnStatement(t.callExpression(t.identifier(unrefAlias), [value]))])
    )
  }

  // MemberExpression 和其他表达式直接返回
  return t.objectMethod('get', t.identifier(key), [], t.blockStatement([t.returnStatement(value)]))
}

/**
 * 创建 v-model 相关的 props
 */
function createVModelProps(
  value: t.Expression,
  attrNode: t.JSXAttribute | null,
  existingPropNames: Set<string>,
  node: t.JSXElement,
  ctx: TransformContext
): (t.ObjectMethod | t.ObjectProperty)[] {
  // 检查冲突
  if (existingPropNames.has('modelValue') || existingPropNames.has('onUpdate:modelValue')) {
    throw createError('E009', attrNode || node)
  }

  // 检查值类型
  if (!isIdentifier(value) && !isMemberExpression(value)) {
    throw createError('E010', attrNode || node)
  }

  // Identifier: 可能是 ref
  if (isIdentifier(value)) {
    return createIdentifierVModelProps(value, attrNode || node, ctx)
  }

  // MemberExpression: 直接访问
  return createMemberExpressionVModelProps(value)
}

/**
 * 为 Identifier 创建 v-model props
 */
function createIdentifierVModelProps(
  value: t.Identifier,
  node: t.Node,
  ctx: TransformContext
): (t.ObjectMethod | t.ObjectProperty)[] {
  const isKnownRef = ctx.refVariables.has(value.name)

  // 已知 ref 变量
  if (isKnownRef) {
    return [
      // modelValue getter
      t.objectMethod(
        'get',
        t.identifier('modelValue'),
        [],
        t.blockStatement([t.returnStatement(t.memberExpression(value, t.identifier('value')))])
      ),
      // onUpdate:modelValue
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

  // 未知变量需要 unref 和 dev 模式检查
  markImport(ctx, 'unref')
  const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')

  const updateBody: t.Statement[] = []

  // Dev 模式添加 isRef 检查
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
    // modelValue getter
    t.objectMethod(
      'get',
      t.identifier('modelValue'),
      [],
      t.blockStatement([t.returnStatement(t.callExpression(t.identifier(unrefAlias), [value]))])
    ),
    // onUpdate:modelValue
    t.objectProperty(
      t.stringLiteral('onUpdate:modelValue'),
      t.arrowFunctionExpression([t.identifier('v')], t.blockStatement(updateBody))
    )
  ]
}

/**
 * 为 MemberExpression 创建 v-model props
 */
function createMemberExpressionVModelProps(
  value: t.MemberExpression
): (t.ObjectMethod | t.ObjectProperty)[] {
  return [
    // modelValue getter
    t.objectMethod(
      'get',
      t.identifier('modelValue'),
      [],
      t.blockStatement([t.returnStatement(value)])
    ),
    // onUpdate:modelValue
    t.objectProperty(
      t.stringLiteral('onUpdate:modelValue'),
      t.arrowFunctionExpression(
        [t.identifier('v')],
        t.assignmentExpression('=', value, t.identifier('v'))
      )
    )
  ]
}
