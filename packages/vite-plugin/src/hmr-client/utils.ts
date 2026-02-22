import { type Node, parse } from 'acorn'
import { simple as walkSimple } from 'acorn-walk'

export interface ChangeCode {
  build: boolean
  logic: boolean
}

interface SeparationResult {
  logicCode: string
  renderCode: string
}

/**
 * 从代码中提取导入别名映射
 * @param code 源代码
 * @returns 别名映射 Map<本地名称, 原始名称>
 */
function extractImportAliases(code: string): Map<string, string> {
  const aliasMap = new Map<string, string>()

  try {
    const ast = parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module'
    })

    for (const node of (ast as any).body) {
      if (node.type === 'ImportDeclaration') {
        const source = node.source.value
        // 只处理 vitarx 相关的导入
        if (typeof source === 'string' && (source === 'vitarx' || source.startsWith('@vitarx/'))) {
          for (const specifier of node.specifiers) {
            if (specifier.type === 'ImportSpecifier') {
              const imported =
                specifier.imported.type === 'Identifier'
                  ? specifier.imported.name
                  : specifier.imported.value
              const local = specifier.local.name
              // 如果本地名称与导入名称不同，记录别名
              if (imported !== local) {
                aliasMap.set(local, imported)
              }
              // 同时记录原始名称，用于检测
              aliasMap.set(local, imported)
            } else if (specifier.type === 'ImportDefaultSpecifier') {
              // 默认导入，可能是 h 函数
              aliasMap.set(specifier.local.name, 'h')
            } else if (specifier.type === 'ImportNamespaceSpecifier') {
              // 命名空间导入，如 import * as V from 'vitarx'
              // V.createView 形式的调用需要特殊处理
              aliasMap.set(specifier.local.name, '*')
            }
          }
        }
      }
    }
  } catch {
    // 解析失败时忽略
  }

  return aliasMap
}

/**
 * 分离逻辑代码和渲染代码
 * @param functionCode 完整函数代码
 * @returns 包含逻辑代码和渲染代码的对象
 */
function separateLogicAndRender(functionCode: string): SeparationResult {
  const uiNodes: Array<{ start: number; end: number; code: string }> = []

  // 添加括号，兼容匿名函数解析
  const wrappedCode = `(${functionCode})`

  try {
    const ast = parse(wrappedCode, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      allowImportExportEverywhere: true,
      allowHashBang: true,
      allowReserved: true
    })

    // 使用 acorn-walk 遍历 AST
    walkSimple(ast as Node, {
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && /^jsx(DEV\$\d+)$/.test(node.callee.name)) {
          uiNodes.push({
            start: node.start,
            end: node.end,
            code: wrappedCode.slice(node.start, node.end)
          })
        }
      }
    })
  } catch {
    // 解析失败时，返回原始代码作为逻辑代码
    return {
      logicCode: functionCode.trim(),
      renderCode: ''
    }
  }

  // 按位置排序，从后向前替换以保持索引正确
  uiNodes.sort((a, b) => b.start - a.start)

  // 提取 UI 代码
  const renderCode = uiNodes
    .map(n => n.code)
    .reverse()
    .join('\n')

  // 移除 UI 代码后的逻辑代码
  let logicCode = wrappedCode
  for (const node of uiNodes) {
    logicCode = logicCode.slice(0, node.start) + logicCode.slice(node.end)
  }

  return {
    logicCode: logicCode.trim(),
    renderCode
  }
}

/**
 * 判断两个函数组件的差异
 * @param newCode 新函数代码
 * @param oldCode 旧函数代码
 * @returns {ChangeCode}
 */
export function diffComponentChange(newCode: string, oldCode: string): ChangeCode {
  const { renderCode: newRenderCode, logicCode: newLogicCode } = separateLogicAndRender(newCode)

  const { renderCode: oldRenderCode, logicCode: oldLogicCode } = separateLogicAndRender(oldCode)

  return {
    build: newRenderCode !== oldRenderCode,
    logic: newLogicCode !== oldLogicCode
  }
}
