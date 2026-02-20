import * as t from '@babel/types'
import type { TransformContext, RefApiAliases } from '../context'

const REF_APIS = ['ref', 'toRef', 'toRefs', 'shallowRef', 'computed']
const RESPONSIVE_MODULES = ['vitarx', '@vitarx/responsive']

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

export function collectRefApiAliases(program: t.Program): RefApiAliases {
  const aliases: RefApiAliases = {
    ref: null,
    toRef: null,
    toRefs: null,
    shallowRef: null,
    computed: null
  }

  for (const node of program.body) {
    if (node.type !== 'ImportDeclaration') continue
    const source = node.source.value
    if (!RESPONSIVE_MODULES.includes(source)) continue

    for (const specifier of node.specifiers) {
      if (specifier.type !== 'ImportSpecifier') continue

      const importedName =
        specifier.imported.type === 'Identifier'
          ? specifier.imported.name
          : specifier.imported.value

      if (REF_APIS.includes(importedName)) {
        aliases[importedName as keyof RefApiAliases] = specifier.local.name
      }
    }
  }

  return aliases
}

export function collectRefVariables(program: t.Program, refApiAliases: RefApiAliases): Set<string> {
  const refVariables = new Set<string>()
  const refApiLocalNames = new Set<string>()
  const toRefsLocalNames = new Set<string>()

  for (const key of Object.keys(refApiAliases)) {
    const alias = refApiAliases[key as keyof RefApiAliases]
    if (alias) {
      if (key === 'toRefs') {
        toRefsLocalNames.add(alias)
      } else {
        refApiLocalNames.add(alias)
      }
    } else if (REF_APIS.includes(key)) {
      if (key === 'toRefs') {
        toRefsLocalNames.add(key)
      } else {
        refApiLocalNames.add(key)
      }
    }
  }

  function collectFromPattern(pattern: t.LVal, variables: string[]): void {
    if (pattern.type === 'Identifier') {
      variables.push(pattern.name)
    } else if (pattern.type === 'ObjectPattern') {
      for (const prop of pattern.properties) {
        if (prop.type === 'RestElement') {
          collectFromPattern(prop.argument, variables)
        } else {
          collectFromPattern(prop.value as t.LVal, variables)
        }
      }
    } else if (pattern.type === 'ArrayPattern') {
      for (const elem of pattern.elements) {
        if (elem) {
          collectFromPattern(elem as t.LVal, variables)
        }
      }
    }
  }

  function collectFromObjectPattern(pattern: t.ObjectPattern, variables: string[]): void {
    for (const prop of pattern.properties) {
      if (prop.type === 'RestElement') {
        collectFromPattern(prop.argument, variables)
      } else if (prop.value.type === 'Identifier') {
        variables.push(prop.value.name)
      } else if (prop.value.type === 'ObjectPattern') {
        collectFromObjectPattern(prop.value, variables)
      }
    }
  }

  for (const node of program.body) {
    if (node.type !== 'VariableDeclaration') continue

    for (const decl of node.declarations) {
      if (!decl.init) continue
      if (decl.id.type === 'VoidPattern') continue

      const init = decl.init
      if (init.type === 'CallExpression' && init.callee.type === 'Identifier') {
        if (toRefsLocalNames.has(init.callee.name)) {
          if (decl.id.type === 'ObjectPattern') {
            const variables: string[] = []
            collectFromObjectPattern(decl.id, variables)
            for (const v of variables) {
              refVariables.add(v)
            }
          }
        } else if (refApiLocalNames.has(init.callee.name)) {
          const variables: string[] = []
          collectFromPattern(decl.id, variables)
          for (const v of variables) {
            refVariables.add(v)
          }
        }
      }
    }
  }

  return refVariables
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
