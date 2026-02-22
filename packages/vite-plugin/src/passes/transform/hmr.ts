/**
 * HMR 注入模块
 * 负责注入 HMR 相关代码
 * @module passes/transform/hmr
 */
import * as t from '@babel/types'
import {
  collectLocalVariableNames,
  injectGetInstanceImport,
  injectHMRImport,
  injectHMRIntoFunction
} from '../hmr/index.js'
import { type ComponentInfo, generateComponentId } from './collect.js'

/**
 * 注入 HMR 支持
 */
export function injectHMRSupport(
  program: t.Program,
  components: ComponentInfo[],
  filename: string
): void {
  if (components.length === 0) return

  injectHMRImport(program)
  injectGetInstanceImport(program)

  for (const { node } of components) {
    if (node.body?.type === 'BlockStatement') {
      injectHMRIntoFunction(node, collectLocalVariableNames(node.body))
    }
  }

  for (const { name } of components) {
    program.body.push(createBindIdStatement(name, generateComponentId(filename, name)))
  }

  program.body.push(createHotAcceptStatement())
}

/**
 * 创建 bindId 语句
 */
function createBindIdStatement(componentName: string, componentId: string): t.Statement {
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.memberExpression(t.identifier('__$VITARX_HMR$__'), t.identifier('instance')),
        t.identifier('bindId')
      ),
      [t.identifier(componentName), t.stringLiteral(componentId)]
    )
  )
}

/**
 * 创建 import.meta.hot.accept 语句
 */
function createHotAcceptStatement(): t.Statement {
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.memberExpression(
          t.memberExpression(t.identifier('import'), t.identifier('meta')),
          t.identifier('hot')
        ),
        t.identifier('accept')
      ),
      [
        t.arrowFunctionExpression(
          [t.identifier('mod')],
          t.blockStatement([
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.memberExpression(t.identifier('__$VITARX_HMR$__'), t.identifier('instance')),
                  t.identifier('update')
                ),
                [t.identifier('mod')]
              )
            )
          ])
        )
      ]
    )
  )
}
