/**
 * 主转换模块
 * 负责解析 JSX/TSX 代码并转换为 createView 调用
 * @module transform
 */
import generate from '@babel/generator'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import { createContext } from './context'
import type { CompileOptions } from './index'
import {
  collectExistingImports,
  collectLocalBindings,
  collectRefApiAliases,
  collectRefVariables,
  injectImports,
  processJSXElement,
  processJSXFragment,
  processPureCompileComponent,
  processVIfChain,
  transformJSXElement
} from './passes'
import { getJSXElementName, isPureCompileComponent } from './utils/index.js'

export interface TransformResult {
  code: string
  map: any
}

/** 用于追踪已处理的节点 */
const processedNodes = new WeakSet<t.Node>()

/**
 * 转换 JSX/TSX 代码
 * @param code - 源代码
 * @param id - 文件路径
 * @param options - 编译选项
 * @returns 转换结果
 */
export async function transform(
  code: string,
  id: string,
  options: CompileOptions
): Promise<TransformResult | null> {
  // 跳过 node_modules
  if (id.includes('node_modules')) {
    return null
  }

  // 只处理 jsx/tsx 文件
  const ext = id.split('?')[0].split('.').pop()?.toLowerCase()
  if (ext !== 'jsx' && ext !== 'tsx') {
    return null
  }

  // 解析 AST
  const ast = parse(code, {
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
  })

  // 创建转换上下文
  const ctx = createContext(code, id, options, ast)

  // 收集现有导入信息
  const { vitarxImports } = collectExistingImports(ast.program)
  const localBindings = collectLocalBindings(ast.program)
  const allNames = new Set([...localBindings])

  // 设置 API 别名
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
      ctx.vitarxAliases[apiName] = `${apiName}$1`
    }
  }

  // 收集 ref API 别名和 ref 变量
  const refApiAliases = collectRefApiAliases(ast.program)
  ctx.refApiAliases = refApiAliases
  ctx.refVariables = collectRefVariables(ast.program, refApiAliases)

  // 遍历 AST 进行转换
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
        if (name && isPureCompileComponent(name)) {
          return
        }
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

  // 注入导入语句
  injectImports(ast.program, ctx)

  // 生成代码
  const output = generate(
    ast,
    {
      sourceMaps: options.sourceMap !== false,
      filename: id
    },
    code
  )

  return {
    code: output.code,
    map: output.map
  }
}
