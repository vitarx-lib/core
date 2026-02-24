/**
 * AST 收集模块
 * 负责收集导入、导出、组件等信息的收集
 * @module passes/transform/collect
 */
import * as t from '@babel/types'
import { DEFAULT_EXPORT_BASE_NAME, PURE_COMPILE_COMPONENTS } from '../constants/index.js'
import { generateUniqueAlias } from './generate.js'

/**
 * 组件信息
 */
export interface ComponentInfo {
  name: string
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
}
/** 纯编译组件名称集合 */
const PURE_COMPILE_COMPONENT_SET: Set<string> = new Set(PURE_COMPILE_COMPONENTS)

/**
 * 生成唯一的默认导出组件名称
 * 避免与已存在的名称冲突
 */
function generateUniqueDefaultName(exportedNames: Set<string>): string {
  if (!exportedNames.has(DEFAULT_EXPORT_BASE_NAME)) {
    return DEFAULT_EXPORT_BASE_NAME
  }
  return generateUniqueAlias(DEFAULT_EXPORT_BASE_NAME, exportedNames)
}

/**
 * 检查名称是否为有效的组件名称
 * 必须以大写字母开头
 */
function isValidComponentName(name: string): boolean {
  return /^[A-Z]/.test(name)
}

/**
 * 从命名导出中收集名称
 */
function collectFromNamedExport(node: t.ExportNamedDeclaration, names: Set<string>): void {
  if (node.declaration) {
    if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
      names.add(node.declaration.id.name)
    } else if (node.declaration.type === 'VariableDeclaration') {
      for (const decl of node.declaration.declarations) {
        if (decl.id.type === 'Identifier') {
          names.add(decl.id.name)
        }
      }
    }
  }
  if (node.specifiers) {
    for (const spec of node.specifiers) {
      if (spec.type === 'ExportSpecifier') {
        names.add(spec.local.name)
      }
    }
  }
}

/**
 * 从默认导出中收集名称
 */
function collectFromDefaultExport(node: t.ExportDefaultDeclaration, names: Set<string>): void {
  const decl = node.declaration
  if (decl.type === 'FunctionDeclaration' && decl.id) {
    names.add(decl.id.name)
  } else if (decl.type === 'Identifier') {
    names.add(decl.name)
  }
  // 匿名函数不在此处预留名称，而是在处理时动态生成唯一名称
}

/**
 * 检查函数是否为组件函数
 * 通过遍历 AST 检查是否包含 JSX 元素
 */
function isComponentFunction(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
): boolean {
  let result = false

  const check = (n: t.Node): void => {
    if (result) return

    // 直接包含 JSX 元素
    if (n.type === 'JSXElement' || n.type === 'JSXFragment') {
      result = true
      return
    }

    // 检查 return 语句中的纯编译组件
    if (n.type === 'ReturnStatement' && n.argument?.type === 'JSXElement') {
      const opening = n.argument.openingElement
      if (
        opening.name.type === 'JSXIdentifier' &&
        PURE_COMPILE_COMPONENT_SET.has(opening.name.name)
      ) {
        result = true
        return
      }
    }

    // 递归遍历子节点
    for (const key of Object.keys(n)) {
      const child = (n as any)[key]
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const c of child) {
            if (c && typeof child === 'object') check(c)
          }
        } else {
          check(child)
        }
      }
    }
  }

  check(node)
  return result
}

/**
 * 尝试添加组件到列表
 * 检查名称有效性、是否导出、是否为组件函数
 */
function tryAddComponent(
  name: string,
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression,
  exportedNames: Set<string>,
  components: ComponentInfo[]
): void {
  if (isValidComponentName(name) && exportedNames.has(name) && isComponentFunction(node)) {
    components.push({ name, node })
  }
}

/**
 * 处理变量声明中的组件
 */
function processVariableDeclaration(
  declaration: t.VariableDeclaration,
  exportedNames: Set<string>,
  components: ComponentInfo[]
): void {
  for (const decl of declaration.declarations) {
    if (decl.id.type !== 'Identifier') continue

    const init = decl.init
    if (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression') {
      tryAddComponent(decl.id.name, init, exportedNames, components)
    }
  }
}

/**
 * 将函数表达式或箭头函数转换为命名函数声明
 */
function convertToNamedFunctionDeclaration(
  func: t.FunctionExpression | t.ArrowFunctionExpression,
  name: string
): t.FunctionDeclaration {
  let body: t.BlockStatement
  if (func.type === 'ArrowFunctionExpression' && func.body.type !== 'BlockStatement') {
    body = t.blockStatement([t.returnStatement(func.body)])
  } else {
    body = func.body as t.BlockStatement
  }

  const funcDecl = t.functionDeclaration(
    t.identifier(name),
    func.params,
    body,
    func.type === 'FunctionExpression' ? func.generator : false,
    func.async
  )
  funcDecl.loc = func.loc
  return funcDecl
}

/**
 * 处理默认导出的匿名函数
 * 为匿名函数生成唯一名称并转换为命名函数声明
 */
function processAnonymousDefaultExport(
  node: t.ExportDefaultDeclaration,
  exportedNames: Set<string>,
  components: ComponentInfo[]
): void {
  const decl = node.declaration
  let funcNode: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression | null =
    null
  let name: string

  // 匿名函数声明
  if (decl.type === 'FunctionDeclaration' && !decl.id) {
    if (!isComponentFunction(decl)) return
    name = generateUniqueDefaultName(exportedNames)
    decl.id = t.identifier(name)
    funcNode = decl
  }
  // 函数表达式
  else if (decl.type === 'FunctionExpression') {
    if (!isComponentFunction(decl)) return
    name = generateUniqueDefaultName(exportedNames)
    funcNode = convertToNamedFunctionDeclaration(decl, name)
    node.declaration = funcNode
  }
  // 箭头函数
  else if (decl.type === 'ArrowFunctionExpression') {
    if (!isComponentFunction(decl)) return
    name = generateUniqueDefaultName(exportedNames)
    funcNode = convertToNamedFunctionDeclaration(decl, name)
    node.declaration = funcNode
  }

  if (funcNode) {
    components.push({ name: name!, node: funcNode })
  }
}

/**
 * 收集所有导出的标识符名称
 */
function collectExportedNames(program: t.Program): Set<string> {
  const names = new Set<string>()

  for (const node of program.body) {
    if (node.type === 'ExportNamedDeclaration') {
      collectFromNamedExport(node, names)
    } else if (node.type === 'ExportDefaultDeclaration') {
      collectFromDefaultExport(node, names)
    }
  }

  return names
}

/**
 * 收集模块中的组件函数
 */
export function collectComponentFunctions(program: t.Program): ComponentInfo[] {
  const exportedNames = collectExportedNames(program)
  const components: ComponentInfo[] = []

  for (const node of program.body) {
    // 普通函数声明
    if (node.type === 'FunctionDeclaration' && node.id) {
      tryAddComponent(node.id.name, node, exportedNames, components)
    }
    // 普通变量声明
    else if (node.type === 'VariableDeclaration') {
      processVariableDeclaration(node, exportedNames, components)
    }
    // 命名导出
    else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
        tryAddComponent(node.declaration.id.name, node.declaration, exportedNames, components)
      } else if (node.declaration.type === 'VariableDeclaration') {
        processVariableDeclaration(node.declaration, exportedNames, components)
      }
    }
    // 默认导出
    else if (node.type === 'ExportDefaultDeclaration') {
      const decl = node.declaration
      // 命名函数声明
      if (decl.type === 'FunctionDeclaration' && decl.id) {
        tryAddComponent(decl.id.name, decl, exportedNames, components)
      }
      // 匿名函数（函数声明、函数表达式、箭头函数）
      else {
        processAnonymousDefaultExport(node, exportedNames, components)
      }
    }
  }

  return components
}
