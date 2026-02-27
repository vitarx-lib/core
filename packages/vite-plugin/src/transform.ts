/**
 * 主转换模块
 * 负责解析 JSX/TSX 代码并转换为 createView 调用
 * @module transform
 */
import generate from '@babel/generator'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import { createContext, type TransformContext } from './context.js'
import {
  collectExistingImports,
  collectLocalBindings,
  collectRefApiAliases,
  collectRefVariables,
  injectHMRSupport,
  injectImports,
  processJSXElement,
  processJSXFragment,
  processPureCompileComponent,
  processVIfChain,
  transformJSXElement
} from './passes/index.js'
import {
  collectComponentFunctions,
  generateUniqueAlias,
  getJSXElementName,
  isPureCompileComponent
} from './utils/index.js'

export interface TransformResult {
  code: string
  map: any
}

export interface CompileOptions {
  hmr: boolean
  dev: boolean
  ssr: boolean
  runtimeModule: string
  sourceMap: boolean | 'inline' | 'both'
}

/** 用于追踪已处理的节点 */
const processedNodes = new WeakSet<t.Node>()

/**
 * 检查文件是否需要转换
 */
function shouldTransform(id: string): boolean {
  if (id.includes('node_modules')) return false
  const ext = id.split('?')[0].split('.').pop()?.toLowerCase()
  return ext === 'jsx' || ext === 'tsx'
}

/**
 * 创建解析器选项
 */
function createParserOptions(): any {
  return {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'decorators',
      'classProperties',
      'objectRestSpread',
      'optionalChaining',
      'nullishCoalescingOperator'
    ]
  }
}

/**
 * 设置 API 别名
 */
function setupAliases(ctx: TransformContext, program: t.Program): void {
  const { vitarxImports } = collectExistingImports(program)
  const localBindings = collectLocalBindings(program)
  const allNames = new Set([...localBindings])

  const apiNames: Array<keyof typeof ctx.vitarxAliases> = [
    'createView',
    'Fragment',
    'branch',
    'dynamic',
    'access',
    'withDirectives',
    'unref',
    'isRef'
  ]

  for (const apiName of apiNames) {
    if (vitarxImports.has(apiName)) {
      ctx.vitarxAliases[apiName] = vitarxImports.get(apiName)!
    } else if (allNames.has(apiName)) {
      ctx.vitarxAliases[apiName] = generateUniqueAlias(apiName, allNames)
    }
  }

  if (ctx.options.hmr) {
    ctx.vitarxAliases.createView = generateUniqueAlias('jsxDEV', allNames)
  }
}

/**
 * 收集 ref 相关信息
 */
function collectRefInfo(ctx: TransformContext, program: t.Program): void {
  const refApiAliases = collectRefApiAliases(program)
  ctx.refApiAliases = refApiAliases
  ctx.refVariables = collectRefVariables(program, refApiAliases)
}

/**
 * 转换 AST
 */
function transformAST(ast: t.File, ctx: TransformContext): void {
  traverse(ast, {
    JSXElement: {
      enter(path) {
        if (processedNodes.has(path.node)) return
        const name = getJSXElementName(path.node)
        if (name && isPureCompileComponent(name)) {
          processedNodes.add(path.node)
          processPureCompileComponent(path, ctx)
        }
      },
      exit(path) {
        if (processedNodes.has(path.node)) return
        const name = getJSXElementName(path.node)
        if (name && isPureCompileComponent(name)) return
        processedNodes.add(path.node)
        processJSXElement(path, ctx)
      }
    },
    JSXFragment: {
      enter(path) {
        processVIfChain(path, ctx, transformJSXElement)
      },
      exit(path) {
        if (processedNodes.has(path.node)) return
        processedNodes.add(path.node)
        processJSXFragment(path, ctx)
      }
    }
  })
}

/**
 * 生成代码
 */
function generateCode(
  ast: t.File,
  code: string,
  id: string,
  sourceMap: boolean | 'inline' | 'both'
): TransformResult {
  const output = generate(ast, { sourceMaps: sourceMap !== false, filename: id }, code)
  return { code: output.code, map: output.map }
}

/**
 * 转换 JSX/TSX 代码
 */
export async function transform(
  code: string,
  id: string,
  options: CompileOptions
): Promise<TransformResult | null> {
  if (!shouldTransform(id)) return null

  const ast = parse(code, createParserOptions())
  const ctx = createContext(code, id, options, ast)

  setupAliases(ctx, ast.program)

  collectRefInfo(ctx, ast.program)

  const components = collectComponentFunctions(ast.program)

  transformAST(ast, ctx)

  injectImports(ast.program, ctx)

  if (options.hmr && components.length > 0) {
    injectHMRSupport(ast.program, components, id)
  }

  return generateCode(ast, code, id, options.sourceMap)
}
