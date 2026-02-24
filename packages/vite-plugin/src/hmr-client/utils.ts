/**
 * HMR 代码变更检测工具
 * 用于判断组件代码中 UI 描述部分和非 UI 部分的变更
 * @module hmr-client/utils
 */
import { type Node, parse } from 'acorn'
import { simple as walkSimple } from 'acorn-walk'

/**
 * 代码变更类型
 */
export interface ChangeCode {
  /** UI 描述代码是否变化（需要重新构建视图） */
  build: boolean
  /** 非 UI 代码是否变化（需要完全重新挂载） */
  logic: boolean
}

/**
 * 代码分离结果
 */
interface SeparationResult {
  /** 非 UI 代码（逻辑代码） */
  logicCode: string
  /** UI 描述代码 */
  renderCode: string
}

/**
 * UI 相关的运行时 API 名称
 * 这些 API 调用代表 UI 描述代码
 */
const UI_APIS = new Set(['createView', 'branch', 'dynamic', 'access', 'withDirectives', 'jsxDEV'])

/**
 * 判断标识符名称是否为 UI API
 * 支持原始名称和带后缀的名称（如 jsxDEV$1）
 */
function isUIApi(name: string): boolean {
  if (UI_APIS.has(name)) return true
  // 支持带数字后缀的 createView
  return /^jsxDEV\$\d+$/.test(name) || /^createView\$\d+$/.test(name)
}

/**
 * 从函数代码中分离 UI 代码和非 UI 代码
 * @param functionCode 完整函数代码
 * @returns 包含逻辑代码和渲染代码的对象
 */
function separateLogicAndRender(functionCode: string): SeparationResult {
  const uiNodes: Array<{ start: number; end: number }> = []

  // 包装代码以便解析
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

    // 遍历 AST 收集所有 UI API 调用节点
    walkSimple(ast as Node, {
      CallExpression(node: any) {
        const callee = node.callee

        // 直接调用：createView(...)
        if (callee.type === 'Identifier' && isUIApi(callee.name)) {
          uiNodes.push({ start: node.start, end: node.end })
          return
        }

        // 成员调用：exports.createView(...)
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          isUIApi(callee.property.name)
        ) {
          uiNodes.push({ start: node.start, end: node.end })
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
    .map(n => wrappedCode.slice(n.start, n.end))
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
 * 规范化代码字符串
 * 移除多余空白、注释等，用于比较
 */
function normalizeCode(code: string): string {
  // 移除多行注释
  let result = code.replace(/\/\*[\s\S]*?\*\//g, '')
  // 移除单行注释
  result = result.replace(/\/\/.*$/gm, '')
  // 移除多余空白
  result = result.replace(/\s+/g, ' ')
  // 移除首尾空白
  return result.trim()
}

/**
 * 判断两个函数组件的代码差异
 *
 * 分析策略：
 * 1. 解析函数代码，提取所有 createView/branch/dynamic 等 UI API 调用
 * 2. 将这些调用识别为 UI 描述代码
 * 3. 其余代码识别为非 UI 代码（逻辑代码）
 * 4. 分别比较 UI 代码和非 UI 代码是否变化
 *
 * @param newCode 新函数代码
 * @param oldCode 旧函数代码
 * @returns {ChangeCode} 变更检测结果
 */
export function diffComponentChange(newCode: string, oldCode: string): ChangeCode {
  const { renderCode: newRenderCode, logicCode: newLogicCode } = separateLogicAndRender(newCode)

  const { renderCode: oldRenderCode, logicCode: oldLogicCode } = separateLogicAndRender(oldCode)

  // 规范化后比较，避免格式差异导致误判
  const normalizedNewLogic = normalizeCode(newLogicCode)
  const normalizedOldLogic = normalizeCode(oldLogicCode)
  const normalizedNewRender = normalizeCode(newRenderCode)
  const normalizedOldRender = normalizeCode(oldRenderCode)

  return {
    // UI 代码变化：需要重新构建视图
    build: normalizedNewRender !== normalizedOldRender,
    // 非 UI 代码变化：需要完全重新挂载组件
    logic: normalizedNewLogic !== normalizedOldLogic
  }
}
