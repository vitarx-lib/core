import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'
import type { CompileOptions } from './index'
import { createContext, TransformContext } from './context'
import { processPureCompileComponent } from './passes/processPureCompileComponent'
import { processVIfChain } from './passes/processVIfChain'
import { processJSXFragment } from './passes/processJSXFragment'
import { processJSXElement } from './passes/processJSXElement'
import { injectImports, collectExistingImports, collectLocalBindings } from './passes/injectImports'
import { isJSXElement, isJSXFragment, isPureCompileComponent, getJSXElementName } from './utils/ast'

export interface TransformResult {
  code: string
  map: any
}

const processedNodes = new WeakSet<t.Node>()

export async function transform(
  code: string,
  id: string,
  options: CompileOptions
): Promise<TransformResult | null> {
  if (id.includes('node_modules')) {
    return null
  }

  const ext = id.split('?')[0].split('.').pop()?.toLowerCase()
  if (ext !== 'jsx' && ext !== 'tsx') {
    return null
  }

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

  const ctx = createContext(code, id, options, ast)

  const { vitarxImports } = collectExistingImports(ast.program)
  const localBindings = collectLocalBindings(ast.program)
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
      ctx.vitarxAliases[apiName] = `${apiName}$1`
    }
  }

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
        processVIfChain(path, ctx)
      },
      exit(path) {
        if (processedNodes.has(path.node)) return
        processedNodes.add(path.node)
        processJSXFragment(path, ctx)
      }
    }
  })

  injectImports(ast.program, ctx)

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
