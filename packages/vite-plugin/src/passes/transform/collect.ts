/**
 * AST 收集模块
 * 负责收集导入、导出、组件等信息的收集
 * @module passes/transform/collect
 */
import * as t from '@babel/types'

/** 纯编译组件名称集合 */
export const PURE_COMPILE_COMPONENTS = new Set(['Switch', 'IfBlock'])

/**
 * 收集所有导出的标识符名称
 */
export function collectExportedNames(program: t.Program): Set<string> {
  const names = new Set<string>()

  for (const node of program.body) {
    if (node.type === 'ExportNamedDeclaration') {
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

    if (node.type === 'ExportDefaultDeclaration') {
      if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
        names.add(node.declaration.id.name)
      } else if (node.declaration.type === 'Identifier') {
        names.add(node.declaration.name)
      }
    }
  }

  return names
}

/**
 * 检查是否是有效的组件名称（大写字母开头且被导出）
 */
export function isValidComponentName(name: string, exportedNames: Set<string>): boolean {
  return /^[A-Z]/.test(name) && exportedNames.has(name)
}

/**
 * 生成组件唯一 ID（文件路径 + 组件名称）
 */
export function generateComponentId(filename: string, componentName: string): string {
  const combined = `${filename}:${componentName}`
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(16)
}

/**
 * 检查函数是否为组件函数
 */
export function isComponentFunction(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
): boolean {
  let result = false

  const check = (n: t.Node): void => {
    if (result) return

    if (n.type === 'JSXElement' || n.type === 'JSXFragment') {
      result = true
      return
    }

    if (n.type === 'ReturnStatement' && n.argument?.type === 'JSXElement') {
      const opening = n.argument.openingElement
      if (opening.name.type === 'JSXIdentifier' && PURE_COMPILE_COMPONENTS.has(opening.name.name)) {
        result = true
        return
      }
    }

    for (const key of Object.keys(n)) {
      const child = (n as any)[key]
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const c of child) {
            if (c && typeof c === 'object') check(c)
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
 * 组件信息
 */
export interface ComponentInfo {
  name: string
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
}

/**
 * 收集模块中的组件函数
 */
export function collectComponentFunctions(program: t.Program, exportedNames: Set<string>): ComponentInfo[] {
  const components: ComponentInfo[] = []

  for (const node of program.body) {
    if (node.type === 'FunctionDeclaration' && node.id) {
      if (isValidComponentName(node.id.name, exportedNames) && isComponentFunction(node)) {
        components.push({ name: node.id.name, node })
      }
    }

    if (node.type === 'VariableDeclaration') {
      for (const decl of node.declarations) {
        if (decl.id.type === 'Identifier') {
          const name = decl.id.name
          if (
            isValidComponentName(name, exportedNames) &&
            (decl.init?.type === 'ArrowFunctionExpression' || decl.init?.type === 'FunctionExpression')
          ) {
            if (isComponentFunction(decl.init)) {
              components.push({ name, node: decl.init })
            }
          }
        }
      }
    }

    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
        const name = node.declaration.id.name
        if (isValidComponentName(name, exportedNames) && isComponentFunction(node.declaration)) {
          components.push({ name, node: node.declaration })
        }
      }
      if (node.declaration.type === 'VariableDeclaration') {
        for (const decl of node.declaration.declarations) {
          if (decl.id.type === 'Identifier') {
            const name = decl.id.name
            if (
              isValidComponentName(name, exportedNames) &&
              (decl.init?.type === 'ArrowFunctionExpression' || decl.init?.type === 'FunctionExpression')
            ) {
              if (isComponentFunction(decl.init)) {
                components.push({ name, node: decl.init })
              }
            }
          }
        }
      }
    }

    if (node.type === 'ExportDefaultDeclaration') {
      if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
        const name = node.declaration.id.name
        if (isValidComponentName(name, exportedNames) && isComponentFunction(node.declaration)) {
          components.push({ name, node: node.declaration })
        }
      }
    }
  }

  return components
}
