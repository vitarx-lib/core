/**
 * HMR 代码注入模块
 * 在 HMR 模式下为组件函数注入热更新支持代码
 * @module passes/hmr
 */
import * as t from '@babel/types'
import { HMR } from '../../constants/index.js'
import { collectPatternBindings, type ComponentInfo } from '../../utils/index.js'

/**
 * 注入 HMR 客户端导入
 * @param program - AST Program 节点
 */
function injectHMRImport(program: t.Program): void {
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
function injectGetInstanceImport(program: t.Program): void {
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
function createHMRRegistrationStatements(variableNames: string[]): t.Statement[] {
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
            t.callExpression(
              t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
              []
            ),
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
function collectLocalVariableNames(functionBody: t.BlockStatement): string[] {
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
 * 判断表达式是否为函数类型
 * 包括：箭头函数、函数表达式、类表达式
 */
function isFunctionExpression(expr: t.Expression | null): boolean {
  if (!expr) return false
  return (
    expr.type === 'ArrowFunctionExpression' ||
    expr.type === 'FunctionExpression' ||
    expr.type === 'ClassExpression'
  )
}

/**
 * 创建状态恢复表达式
 * 格式：__$VITARX_HMR$__.instance.memo(__$VITARX_HMR_VIEW_NODE$__, '变量名') ?? 原始初始值
 */
function createMemoExpression(variableName: string, originalInit: t.Expression): t.Expression {
  return t.logicalExpression(
    '??',
    t.callExpression(
      t.memberExpression(
        t.memberExpression(t.identifier(HMR.manager), t.identifier('instance')),
        t.identifier('memo')
      ),
      [t.identifier(HMR.view), t.stringLiteral(variableName)]
    ),
    originalInit
  )
}

/**
 * 为单个变量声明注入状态恢复代码
 * 仅处理标识符类型的变量声明，且初始值不是函数
 */
function injectStatePreservationForDeclaration(decl: t.VariableDeclarator): void {
  // 只处理标识符类型的变量声明
  if (decl.id.type !== 'Identifier') return

  // 没有初始值，不需要处理
  if (!decl.init) return

  // 初始值是函数，不需要状态恢复
  if (isFunctionExpression(decl.init)) return

  // 注入状态恢复代码
  decl.init = createMemoExpression(decl.id.name, decl.init)
}

/**
 * 为函数体内的变量声明注入状态恢复代码
 */
function injectStatePreservation(functionBody: t.BlockStatement): void {
  for (const stmt of functionBody.body) {
    if (stmt.type === 'VariableDeclaration') {
      for (const decl of stmt.declarations) {
        injectStatePreservationForDeclaration(decl)
      }
    }
  }
}

/**
 * 为组件函数注入 HMR 注册代码
 * @param func - 函数声明/表达式/箭头函数
 * @param variableNames - 需要追踪的变量名列表
 */
function injectHMRIntoFunction(
  func: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression,
  variableNames: string[]
): void {
  if (!func.body || func.body.type !== 'BlockStatement') return

  // 注入状态恢复代码
  injectStatePreservation(func.body)

  // 注入 HMR 注册代码
  const statements = createHMRRegistrationStatements(variableNames)
  func.body.body.unshift(...statements)
}

/**
 * 创建 bindId 语句
 */
function createBindIdStatement(componentName: string, componentId: string): t.Statement {
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.memberExpression(t.identifier(HMR.manager), t.identifier('instance')),
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
                  t.memberExpression(t.identifier(HMR.manager), t.identifier('instance')),
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

/**
 * 生成组件唯一 ID（文件路径 + 组件名称）
 */
function generateComponentId(filename: string, componentName: string): string {
  const combined = `${filename}:${componentName}`
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(16)
}

/**
 * 注入 HMR 支持
 * 主入口函数，为所有组件注入完整的 HMR 支持
 * @param program - AST Program 节点
 * @param components - 组件信息列表
 * @param filename - 文件名
 */
export function injectHMRSupport(
  program: t.Program,
  components: ComponentInfo[],
  filename: string
): void {
  if (components.length === 0) return

  // 注入必要的导入
  injectHMRImport(program)
  injectGetInstanceImport(program)

  // 为每个组件函数注入 HMR 代码
  for (const { node } of components) {
    if (node.body?.type === 'BlockStatement') {
      injectHMRIntoFunction(node, collectLocalVariableNames(node.body))
    }
  }

  // 为每个组件绑定 ID
  for (const { name } of components) {
    program.body.push(createBindIdStatement(name, generateComponentId(filename, name)))
  }

  // 注入 import.meta.hot.accept
  program.body.push(createHotAcceptStatement())
}
