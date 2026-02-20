import * as t from '@babel/types'
import type { TransformContext } from '../context'

export function collectExistingImports(program: t.Program): {
  localNames: Set<string>
  vitarxImports: Map<string, string>
} {
  const localNames = new Set<string>()
  const vitarxImports = new Map<string, string>()

  for (const node of program.body) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value
      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportSpecifier') {
          localNames.add(specifier.local.name)
          if (source === 'vitarx') {
            const importedName =
              specifier.imported.type === 'Identifier'
                ? specifier.imported.name
                : specifier.imported.value
            vitarxImports.set(importedName, specifier.local.name)
          }
        } else if (specifier.type === 'ImportDefaultSpecifier') {
          localNames.add(specifier.local.name)
          if (source === 'vitarx') {
            vitarxImports.set('default', specifier.local.name)
          }
        } else if (specifier.type === 'ImportNamespaceSpecifier') {
          localNames.add(specifier.local.name)
          if (source === 'vitarx') {
            vitarxImports.set('*', specifier.local.name)
          }
        }
      }
    }
  }

  return { localNames, vitarxImports }
}

export function collectLocalBindings(program: t.Program): Set<string> {
  const bindings = new Set<string>()

  function collectFromPattern(pattern: t.LVal | t.VoidPattern): void {
    if (pattern.type === 'Identifier') {
      bindings.add(pattern.name)
    } else if (pattern.type === 'ObjectPattern') {
      for (const prop of pattern.properties) {
        if (prop.type === 'RestElement') {
          collectFromPattern(prop.argument)
        } else {
          collectFromPattern(prop.value as t.LVal)
        }
      }
    } else if (pattern.type === 'ArrayPattern') {
      for (const elem of pattern.elements) {
        if (elem) {
          collectFromPattern(elem as t.LVal)
        }
      }
    } else if (pattern.type === 'AssignmentPattern') {
      collectFromPattern(pattern.left)
    } else if (pattern.type === 'RestElement') {
      collectFromPattern(pattern.argument)
    }
  }

  for (const node of program.body) {
    if (node.type === 'VariableDeclaration') {
      for (const decl of node.declarations) {
        if (decl.id.type !== 'VoidPattern') {
          collectFromPattern(decl.id)
        }
      }
    } else if (node.type === 'FunctionDeclaration') {
      if (node.id) {
        bindings.add(node.id.name)
      }
      for (const param of node.params) {
        if (param.type === 'Identifier') {
          bindings.add(param.name)
        } else if (
          param.type === 'ObjectPattern' ||
          param.type === 'ArrayPattern' ||
          param.type === 'RestElement'
        ) {
          collectFromPattern(param as t.LVal)
        }
      }
    } else if (node.type === 'ClassDeclaration') {
      if (node.id) {
        bindings.add(node.id.name)
      }
    }
  }

  return bindings
}

function generateAliasName(baseName: string, existingNames: Set<string>): string {
  if (!existingNames.has(baseName)) {
    return baseName
  }
  let counter = 1
  while (existingNames.has(`${baseName}$${counter}`)) {
    counter++
  }
  return `${baseName}$${counter}`
}

export function injectImports(program: t.Program, ctx: TransformContext): void {
  const { localNames, vitarxImports } = collectExistingImports(program)
  ctx.existingImports = localNames

  const localBindings = collectLocalBindings(program)
  const allNames = new Set([...localNames, ...localBindings])

  const hasNamespaceImport = vitarxImports.has('*')

  const apiList: Array<{ name: keyof typeof ctx.vitarxAliases; needed: boolean }> = [
    { name: 'createView', needed: ctx.imports.createView },
    { name: 'Fragment', needed: ctx.imports.Fragment },
    { name: 'branch', needed: ctx.imports.branch },
    { name: 'dynamic', needed: ctx.imports.dynamic },
    { name: 'access', needed: ctx.imports.access },
    { name: 'withDirectives', needed: ctx.imports.withDirectives },
    { name: 'unref', needed: ctx.imports.unref },
    { name: 'isRef', needed: ctx.imports.isRef }
  ]

  for (const api of apiList) {
    if (vitarxImports.has(api.name)) {
      ctx.vitarxAliases[api.name] = vitarxImports.get(api.name)!
    }
  }

  const imports: t.ImportSpecifier[] = []

  for (const api of apiList) {
    if (!api.needed) continue

    if (vitarxImports.has(api.name)) {
      continue
    }

    if (hasNamespaceImport) {
      continue
    }

    const aliasName = generateAliasName(api.name, allNames)

    if (aliasName !== api.name) {
      ctx.vitarxAliases[api.name] = aliasName
      imports.push(t.importSpecifier(t.identifier(aliasName), t.identifier(api.name)))
      allNames.add(aliasName)
    } else if (!allNames.has(api.name)) {
      imports.push(t.importSpecifier(t.identifier(api.name), t.identifier(api.name)))
      allNames.add(api.name)
    } else {
      const newAlias = generateAliasName(api.name, allNames)
      ctx.vitarxAliases[api.name] = newAlias
      imports.push(t.importSpecifier(t.identifier(newAlias), t.identifier(api.name)))
      allNames.add(newAlias)
    }
  }

  if (imports.length === 0) return

  const importDeclaration = t.importDeclaration(imports, t.stringLiteral(ctx.options.runtimeModule))

  const firstNonImportIndex = program.body.findIndex(node => node.type !== 'ImportDeclaration')
  if (firstNonImportIndex === -1) {
    program.body.push(importDeclaration)
  } else {
    program.body.splice(firstNonImportIndex, 0, importDeclaration)
  }
}
