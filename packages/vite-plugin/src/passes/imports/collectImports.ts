/**
 * 导入收集模块
 * 负责收集现有导入信息和本地变量绑定
 * @module passes/imports/collectImports
 */
import * as t from '@babel/types'
import { VITARX_MODULE } from '../../constants/index.js'

/**
 * 收集现有导入信息
 * @param program - AST Program 节点
 * @returns 本地变量名集合和 vitarx 导入映射
 */
export function collectExistingImports(program: t.Program): {
  localNames: Set<string>
  vitarxImports: Map<string, string>
} {
  const localNames = new Set<string>()
  const vitarxImports = new Map<string, string>()

  for (const node of program.body) {
    if (node.type !== 'ImportDeclaration') continue

    const source = node.source.value
    for (const specifier of node.specifiers) {
      localNames.add(specifier.local.name)

      if (source === VITARX_MODULE && specifier.type === 'ImportSpecifier') {
        const importedName =
          specifier.imported.type === 'Identifier'
            ? specifier.imported.name
            : specifier.imported.value
        vitarxImports.set(importedName, specifier.local.name)
      }
    }
  }

  return { localNames, vitarxImports }
}

/**
 * 收集本地变量绑定
 * 包括导入绑定、变量声明、函数声明、类声明
 * @param program - AST Program 节点
 * @returns 本地变量名集合
 */
export function collectLocalBindings(program: t.Program): Set<string> {
  const bindings = new Set<string>()

  for (const node of program.body) {
    if (node.type === 'ImportDeclaration') {
      for (const specifier of node.specifiers) {
        bindings.add(specifier.local.name)
      }
    }

    if (node.type === 'VariableDeclaration') {
      for (const decl of node.declarations) {
        if (decl.id.type !== 'VoidPattern') {
          collectPatternBindings(decl.id, bindings)
        }
      }
    }

    if (node.type === 'FunctionDeclaration' && node.id) {
      bindings.add(node.id.name)
    }

    if (node.type === 'ClassDeclaration' && node.id) {
      bindings.add(node.id.name)
    }
  }

  return bindings
}

/**
 * 从模式中收集变量名
 */
function collectPatternBindings(pattern: t.LVal, variables: Set<string>): void {
  if (pattern.type === 'Identifier') {
    variables.add(pattern.name)
  } else if (pattern.type === 'ObjectPattern') {
    for (const prop of pattern.properties) {
      if (prop.type === 'RestElement') {
        collectPatternBindings(prop.argument, variables)
      } else {
        collectPatternBindings(prop.value as t.LVal, variables)
      }
    }
  } else if (pattern.type === 'ArrayPattern') {
    for (const elem of pattern.elements) {
      if (elem) {
        collectPatternBindings(elem as t.LVal, variables)
      }
    }
  }
}
