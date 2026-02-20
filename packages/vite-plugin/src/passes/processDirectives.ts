import * as t from '@babel/types'
import { TransformContext, markImport } from '../context'
import { isIdentifier, createWithDirectivesCall, addPureComment, getAlias } from '../utils/ast'
import type { PropsResult } from './processProps'

export function processDirectives(
  viewCall: t.CallExpression,
  directives: PropsResult['directives'],
  ctx: TransformContext
): t.CallExpression {
  if (directives.size === 0) {
    return viewCall
  }

  const directiveArray: Array<[string, t.Expression]> = []

  for (const [name, value] of directives) {
    const directiveName = name.slice(2)

    let directiveValue: t.Expression
    if (isIdentifier(value)) {
      markImport(ctx, 'unref')
      const unrefAlias = getAlias(ctx.vitarxAliases, 'unref')
      directiveValue = t.objectExpression([
        t.objectMethod(
          'get',
          t.identifier('value'),
          [],
          t.blockStatement([
            t.returnStatement(t.callExpression(t.identifier(unrefAlias), [value]))
          ])
        )
      ])
    } else {
      directiveValue = t.objectExpression([
        t.objectMethod(
          'get',
          t.identifier('value'),
          [],
          t.blockStatement([
            t.returnStatement(value)
          ])
        )
      ])
    }

    directiveArray.push([directiveName, directiveValue])
  }

  markImport(ctx, 'withDirectives')
  const withDirectivesAlias = getAlias(ctx.vitarxAliases, 'withDirectives')
  return addPureComment(createWithDirectivesCall(viewCall, directiveArray, withDirectivesAlias))
}
