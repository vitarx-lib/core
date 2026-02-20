import type { Node, File } from '@babel/types'
import type { CompileOptions } from './index'

export interface ImportInfo {
  createView: boolean
  Fragment: boolean
  branch: boolean
  dynamic: boolean
  access: boolean
  withDirectives: boolean
  unref: boolean
  isRef: boolean
}

export interface VitarxImportAliases {
  createView: string | null
  Fragment: string | null
  branch: string | null
  dynamic: string | null
  access: string | null
  withDirectives: string | null
  unref: string | null
  isRef: string | null
}

export interface TransformContext {
  code: string
  id: string
  filename: string
  options: CompileOptions
  ast: File
  imports: ImportInfo
  existingImports: Set<string>
  vitarxAliases: VitarxImportAliases
}

export function createContext(
  code: string,
  id: string,
  options: CompileOptions,
  ast: File
): TransformContext {
  const filename = id.split('?')[0]
  return {
    code,
    id,
    filename,
    options,
    ast,
    imports: {
      createView: false,
      Fragment: false,
      branch: false,
      dynamic: false,
      access: false,
      withDirectives: false,
      unref: false,
      isRef: false,
    },
    existingImports: new Set(),
    vitarxAliases: {
      createView: null,
      Fragment: null,
      branch: null,
      dynamic: null,
      access: null,
      withDirectives: null,
      unref: null,
      isRef: null,
    },
  }
}

export function markImport(ctx: TransformContext, name: keyof ImportInfo): void {
  ctx.imports[name] = true
}

export function getLocation(node: Node): { line: number; column: number } | null {
  if (node.loc) {
    return {
      line: node.loc.start.line,
      column: node.loc.start.column + 1,
    }
  }
  return null
}

export function getIdentifierName(ctx: TransformContext, apiName: keyof VitarxImportAliases): string {
  const alias = ctx.vitarxAliases[apiName]
  if (alias) {
    return alias
  }
  return apiName
}
