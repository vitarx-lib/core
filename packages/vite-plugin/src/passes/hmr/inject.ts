/**
 * HMR 代码注入模块
 * 在 HMR 模式下为组件函数注入热更新支持代码
 * @module passes/hmr/inject
 */
import * as t from '@babel/types'
import { HMR } from '../../constants/index.js'
import { collectPatternBindings } from '../../utils/index.js'

/**
 * 注入 HMR 客户端导入
 * @param program - AST Program 节点
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
 * @param program - AST Program 节点
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
 * @param variableNames - 需要追踪的变量名列表
 * @returns HMR 注册语句数组
 */
export function createHMRRegistrationStatements(variableNames: string[]): t.Statement[] {
  const statements: t.Statement[] = []

  // 获取当前视图实例
  statements.push(
    t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.identifier(HMR.view),
        t.callExpression(t.identifier('getInstance'), [])
      )
    )
  )

  // 注册到 HMR 管理器
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

  // 创建状态追踪对象
  const stateProperties = variableNames.map(name =>
    t.objectMethod(
      'get',
      t.identifier(name),
      [],
      t.blockStatement([t.returnStatement(t.identifier(name))])
    )
  )

  // 异步设置状态
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
 * @param functionBody - 函数体语句块
 * @returns 变量名数组
 */
export function collectLocalVariableNames(functionBody: t.BlockStatement): string[] {
  const variableNames = new Set<string>()

  for (const stmt of functionBody.body) {
    if (stmt.type === 'VariableDeclaration') {
      for (const decl of stmt.declarations) {
        if (decl.id.type !== 'VoidPattern') {
          collectPatternBindings(decl.id, variableNames)
        }
      }
    }
  }

  return Array.from(variableNames)
}

/**
 * 为组件函数注入 HMR 注册代码
 * @param func - 函数声明/表达式/箭头函数
 * @param variableNames - 需要追踪的变量名列表
 */
export function injectHMRIntoFunction(
  func: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression,
  variableNames: string[]
): void {
  if (!func.body || func.body.type !== 'BlockStatement') return

  const statements = createHMRRegistrationStatements(variableNames)
  func.body.body.unshift(...statements)
}
