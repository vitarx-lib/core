/**
 * 导入注入模块
 * 负责动态注入 vitarx 导入语句
 * @module passes/imports/injectImports
 */
import * as t from '@babel/types'
import { VITARX_MODULE } from '../../constants/index.js'
import type { ImportInfo, TransformContext, VitarxImportAliases } from '../../context.js'

/**
 * API 导入配置
 * 定义需要注入的 API 及其与 ImportInfo 的映射关系
 */
const API_IMPORT_CONFIG: Array<{
  name: keyof VitarxImportAliases
  importKey: keyof ImportInfo
}> = [
  { name: 'createView', importKey: 'createView' },
  { name: 'Fragment', importKey: 'Fragment' },
  { name: 'branch', importKey: 'branch' },
  { name: 'dynamic', importKey: 'dynamic' },
  { name: 'access', importKey: 'access' },
  { name: 'withDirectives', importKey: 'withDirectives' },
  { name: 'unref', importKey: 'unref' },
  { name: 'isRef', importKey: 'isRef' }
]

/**
 * 注入 vitarx 导入
 * 根据已使用的 API 动态生成导入语句
 * @param program - AST Program 节点
 * @param ctx - 转换上下文
 */
export function injectImports(program: t.Program, ctx: TransformContext): void {
  if (!needsInject(ctx)) return

  const existingVitarxImport = findExistingVitarxImport(program)

  if (existingVitarxImport) {
    appendImportSpecifiers(existingVitarxImport, ctx)
  } else {
    const specifiers = buildImportSpecifiers(ctx)
    if (specifiers.length === 0) return
    const importDecl = t.importDeclaration(specifiers, t.stringLiteral(VITARX_MODULE))
    program.body.unshift(importDecl)
  }
}

/**
 * 查找已存在的 vitarx 导入语句
 */
function findExistingVitarxImport(program: t.Program): t.ImportDeclaration | null {
  for (const node of program.body) {
    if (node.type === 'ImportDeclaration' && node.source.value === VITARX_MODULE) {
      return node
    }
  }
  return null
}

/**
 * 向已存在的导入语句追加说明符
 */
function appendImportSpecifiers(importDecl: t.ImportDeclaration, ctx: TransformContext): void {
  const existingLocals = new Set<string>()
  for (const spec of importDecl.specifiers) {
    if (spec.type === 'ImportSpecifier') {
      existingLocals.add(spec.local.name)
    }
  }

  for (const { name, importKey } of API_IMPORT_CONFIG) {
    if (!ctx.imports[importKey]) continue

    const alias = ctx.vitarxAliases[name]
    const localName = alias || name

    if (existingLocals.has(localName)) continue

    const imported = t.identifier(name)
    const local = t.identifier(localName)
    importDecl.specifiers.push(t.importSpecifier(local, imported))
  }
}

/**
 * 检查是否需要注入导入
 */
function needsInject(ctx: TransformContext): boolean {
  return Object.values(ctx.imports).some(Boolean)
}

/**
 * 构建导入说明符列表
 */
function buildImportSpecifiers(ctx: TransformContext): t.ImportSpecifier[] {
  const specifiers: t.ImportSpecifier[] = []

  for (const { name, importKey } of API_IMPORT_CONFIG) {
    if (ctx.imports[importKey]) {
      const alias = ctx.vitarxAliases[name]
      const imported = t.identifier(name)
      const local = alias ? t.identifier(alias) : imported
      specifiers.push(t.importSpecifier(local, imported))
    }
  }

  return specifiers
}
