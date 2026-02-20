import * as t from '@babel/types'
import { TransformContext, markImport } from '../context'
import {
  isIdentifier,
  isMemberExpression,
  isStringLiteral,
  isNumericLiteral,
  isBooleanLiteral,
  isJSXExpressionContainer,
  getAlias,
} from '../utils/ast'
import { createError } from '../error'

export interface PropsResult {
  props: t.ObjectExpression | null
  directives: Map<string, t.Expression>
  hasVBind: boolean
}

export function processProps(
  node: t.JSXElement,
  ctx: TransformContext
): PropsResult {
  const attributes = node.openingElement.attributes
  const properties: (t.ObjectProperty | t.ObjectMethod | t.SpreadElement)[] = []
  const directives = new Map<string, t.Expression>()
  let hasVBind = false
  let hasVModel = false
  let vModelValue: t.Expression | null = null
  let vModelNode: t.JSXAttribute | null = null

  const existingPropNames = new Set<string>()

  for (const attr of attributes) {
    if (attr.type === 'JSXSpreadAttribute') {
      if (hasVBind) {
        throw createError('E001', node)
      }
      properties.push(t.objectProperty(t.stringLiteral('v-bind'), attr.argument))
      hasVBind = true
      continue
    }

    if (attr.type === 'JSXAttribute') {
      const attrName = attr.name

      if (attrName.type === 'JSXNamespacedName') {
        const namespace = attrName.namespace.name
        const name = attrName.name.name

        if (namespace === 'v') {
          const directiveName = `v-${name}`
          if (directiveName === 'v-bind') {
            if (hasVBind) {
              throw createError('E001', node)
            }
            if (attr.value && attr.value.type === 'JSXExpressionContainer') {
              properties.push(t.objectProperty(t.stringLiteral('v-bind'), attr.value.expression as t.Expression))
              hasVBind = true
            }
            continue
          }
          if (directiveName !== 'v-if' && directiveName !== 'v-else-if' && directiveName !== 'v-else' && directiveName !== 'v-model') {
            const value = getAttributeValue(attr.value, ctx)
            directives.set(directiveName, value)
          }
          continue
        }

        const fullName = `${namespace}:${name}`
        existingPropNames.add(fullName)
        const value = getAttributeValue(attr.value, ctx)
        const prop = createProperty(fullName, value, ctx)
        properties.push(prop)
        continue
      }

      if (attrName.type === 'JSXIdentifier') {
        const name = attrName.name

        if (name.startsWith('v-')) {
          if (name === 'v-bind') {
            if (hasVBind) {
              throw createError('E001', node)
            }
            if (attr.value && attr.value.type === 'JSXExpressionContainer') {
              properties.push(t.objectProperty(t.stringLiteral('v-bind'), attr.value.expression as t.Expression))
              hasVBind = true
            }
            continue
          }
          if (name === 'v-model') {
            hasVModel = true
            vModelNode = attr
            if (attr.value && attr.value.type === 'JSXExpressionContainer') {
              vModelValue = attr.value.expression as t.Expression
            }
            continue
          }
          if (name !== 'v-if' && name !== 'v-else-if' && name !== 'v-else') {
            const value = getAttributeValue(attr.value, ctx)
            directives.set(name, value)
          }
          continue
        }

        existingPropNames.add(name)
        const value = getAttributeValue(attr.value, ctx)
        const prop = createProperty(name, value, ctx)
        properties.push(prop)
      }
    }
  }

  if (hasVModel) {
    if (existingPropNames.has('modelValue') || existingPropNames.has('onUpdate:modelValue')) {
      throw createError('E009', vModelNode || node)
    }

    if (!vModelValue) {
      throw createError('E010', vModelNode || node)
    }

    const vModelProps = createVModelProps(vModelValue, vModelNode || node, ctx)
    properties.push(...vModelProps)
  }

  const props = properties.length > 0 ? t.objectExpression(properties) : null

  return { props, directives, hasVBind }
}

function getAttributeValue(
  value: t.JSXAttribute['value'],
  ctx: TransformContext
): t.Expression {
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

function createProperty(
  key: string,
  value: t.Expression,
  ctx: TransformContext
): t.ObjectProperty | t.ObjectMethod {
  if (isStringLiteral(value) || isNumericLiteral(value) || isBooleanLiteral(value)) {
    return t.objectProperty(t.identifier(key), value)
  }

  if (isIdentifier(value)) {
    markImport(ctx, 'unref')
    const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')
    return t.objectMethod(
      'get',
      t.identifier(key),
      [],
      t.blockStatement([
        t.returnStatement(t.callExpression(t.identifier(unrefAlias), [value]))
      ])
    )
  }

  if (isMemberExpression(value)) {
    return t.objectMethod(
      'get',
      t.identifier(key),
      [],
      t.blockStatement([
        t.returnStatement(value)
      ])
    )
  }

  return t.objectMethod(
    'get',
    t.identifier(key),
    [],
    t.blockStatement([
      t.returnStatement(value)
    ])
  )
}

function createVModelProps(
  value: t.Expression,
  node: t.Node,
  ctx: TransformContext
): (t.ObjectMethod | t.ObjectProperty)[] {
  if (!isIdentifier(value) && !isMemberExpression(value)) {
    throw createError('E010', node)
  }

  const props: (t.ObjectMethod | t.ObjectProperty)[] = []
  const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')
  const isRefAlias = getAlias(ctx.vitarxAliases, 'isRef')

  if (isIdentifier(value)) {
    markImport(ctx, 'unref')
    
    props.push(t.objectMethod(
      'get',
      t.identifier('modelValue'),
      [],
      t.blockStatement([
        t.returnStatement(t.callExpression(t.identifier(unrefAlias), [value]))
      ])
    ))

    const updateParam = t.identifier('v')
    const updateBody: t.Statement[] = []

    if (ctx.options.dev) {
      markImport(ctx, 'isRef')
      const locInfo = node.loc ? ` at ${ctx.filename}:${node.loc.start.line}:${node.loc.start.column + 1}` : ''
      updateBody.push(
        t.ifStatement(
          t.unaryExpression('!', t.callExpression(t.identifier(isRefAlias), [value])),
          t.blockStatement([
            t.throwStatement(
              t.newExpression(t.identifier('Error'), [
                t.stringLiteral(
                  `[v-model] Identifier must be a ref. Invalid usage${locInfo}`
                )
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
          updateParam
        )
      )
    )

    props.push(t.objectProperty(
      t.stringLiteral('onUpdate:modelValue'),
      t.arrowFunctionExpression([updateParam], t.blockStatement(updateBody))
    ))
  } else {
    props.push(t.objectMethod(
      'get',
      t.identifier('modelValue'),
      [],
      t.blockStatement([
        t.returnStatement(value)
      ])
    ))

    const updateParam = t.identifier('v')
    props.push(t.objectProperty(
      t.stringLiteral('onUpdate:modelValue'),
      t.arrowFunctionExpression(
        [updateParam],
        t.assignmentExpression('=', value, updateParam)
      )
    ))
  }

  return props
}
