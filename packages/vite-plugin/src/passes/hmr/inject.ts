/**
 * HMR 代码注入模块
 * 在 HMR 模式下为组件函数注入热更新支持代码
 * @module passes/hmr/inject
 */
import * as t from '@babel/types'
import { HMR } from '../../constants/index.js'

/**
 * 注入 HMR 客户端导入
 */
export function injectHMRImport(program: t.Program): void {
  const importDecl = t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier(HMR.manager))],
    t.stringLiteral('@vitarx/vite-plugin/hmr-client')
  )
  program.body.unshift(importDecl)
}

/**
 * 注入 getInstance 导入
 */
export function injectGetInstanceImport(program: t.Program): void {
  let vitarxImport: t.ImportDeclaration | null = null
  for (const node of program.body) {
    if (node.type === 'ImportDeclaration' && node.source.value === 'vitarx') {
      vitarxImport = node
      break
    }
  }

  if (vitarxImport) {
    const hasGetInstance = vitarxImport.specifiers.some(
      spec =>
        spec.type === 'ImportSpecifier' &&
        spec.imported.type === 'Identifier' &&
        spec.imported.name === 'getInstance'
    )
    if (!hasGetInstance) {
      vitarxImport.specifiers.push(
        t.importSpecifier(t.identifier('getInstance'), t.identifier('getInstance'))
      )
    }
  } else {
    const importDecl = t.importDeclaration(
      [t.importSpecifier(t.identifier('getInstance'), t.identifier('getInstance'))],
      t.stringLiteral('vitarx')
    )
    program.body.unshift(importDecl)
  }
}

/**
 * 创建组件函数体内的 HMR 注册代码
 */
export function createHMRRegistrationStatements(variableNames: string[]): t.Statement[] {
  const statements: t.Statement[] = []

  statements.push(
    t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.identifier(HMR.view),
        t.callExpression(t.identifier('getInstance'), [])
      )
    )
  )

  statements.push(
    t.expressionStatement(
      t.callExpression(
        t.memberExpression(
          t.memberExpression(t.identifier(HMR.manager), t.identifier('instance')),
          t.identifier('register')
        ),
        [t.identifier(HMR.view)]
      )
    )
  )

  const stateProperties = variableNames.map(name =>
    t.objectMethod(
      'get',
      t.identifier(name),
      [],
      t.blockStatement([t.returnStatement(t.identifier(name))])
    )
  )

  statements.push(
    t.expressionStatement(
      t.logicalExpression(
        '&&',
        t.identifier(HMR.view),
        t.callExpression(
          t.memberExpression(
            t.callExpression(t.memberExpression(t.identifier('Promise'), t.identifier('resolve')), []),
            t.identifier('then')
          ),
          [
            t.arrowFunctionExpression(
              [],
              t.blockStatement([
                t.expressionStatement(
                  t.assignmentExpression(
                    '=',
                    t.memberExpression(t.identifier(HMR.view), t.identifier(HMR.state)),
                    t.objectExpression(stateProperties)
                  )
                )
              ])
            )
          ]
        )
      )
    )
  )

  return statements
}

/**
 * 从函数体中收集局部变量名
 */
export function collectLocalVariableNames(functionBody: t.BlockStatement): string[] {
  const variableNames: string[] = []

  for (const stmt of functionBody.body) {
    if (stmt.type === 'VariableDeclaration') {
      for (const decl of stmt.declarations) {
        if (decl.id.type === 'Identifier') {
          variableNames.push(decl.id.name)
        } else if (decl.id.type === 'ObjectPattern') {
          collectPatternNames(decl.id, variableNames)
        } else if (decl.id.type === 'ArrayPattern') {
          collectArrayPatternNames(decl.id, variableNames)
        }
      }
    }
  }

  return variableNames
}

/**
 * 从对象模式中收集变量名
 */
function collectPatternNames(pattern: t.ObjectPattern, names: string[]): void {
  for (const prop of pattern.properties) {
    if (prop.type === 'RestElement') {
      if (prop.argument.type === 'Identifier') {
        names.push(prop.argument.name)
      }
    } else if (prop.value.type === 'Identifier') {
      names.push(prop.value.name)
    } else if (prop.value.type === 'ObjectPattern') {
      collectPatternNames(prop.value, names)
    } else if (prop.value.type === 'ArrayPattern') {
      collectArrayPatternNames(prop.value, names)
    }
  }
}

/**
 * 从数组模式中收集变量名
 */
function collectArrayPatternNames(pattern: t.ArrayPattern, names: string[]): void {
  for (const elem of pattern.elements) {
    if (!elem) continue
    if (elem.type === 'Identifier') {
      names.push(elem.name)
    } else if (elem.type === 'ObjectPattern') {
      collectPatternNames(elem, names)
    } else if (elem.type === 'ArrayPattern') {
      collectArrayPatternNames(elem, names)
    } else if (elem.type === 'RestElement' && elem.argument.type === 'Identifier') {
      names.push(elem.argument.name)
    }
  }
}

/**
 * 为组件函数注入 HMR 注册代码
 */
export function injectHMRIntoFunction(
  func: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression,
  variableNames: string[]
): void {
  if (!func.body || func.body.type !== 'BlockStatement') return

  const statements = createHMRRegistrationStatements(variableNames)
  func.body.body.unshift(...statements)
}
