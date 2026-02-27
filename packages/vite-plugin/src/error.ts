/**
 * 编译错误处理模块
 * 定义编译器错误类型和错误消息
 * @module error
 */
import type { Node } from '@babel/types'

/**
 * 错误位置信息
 */
export interface ErrorLocation {
  /** 行号 */
  line: number
  /** 列号 */
  column: number
}

/**
 * 编译错误选项
 */
export interface CompilerErrorOptions {
  /** 错误代码 */
  code: string
  /** 错误消息 */
  message: string
  /** 错误位置 */
  loc?: ErrorLocation
  /** 相关 AST 节点 */
  node?: Node
}

/**
 * 编译器错误类
 * 包含错误代码和位置信息
 */
export class CompilerError extends Error {
  /** 错误代码 */
  code: string
  /** 错误位置 */
  loc?: ErrorLocation

  constructor(options: CompilerErrorOptions) {
    super(`[${options.code}] ${options.message}${options.loc ? ` at line ${options.loc.line}:${options.loc.column}` : ''}`)
    this.name = 'CompilerError'
    this.code = options.code
    this.loc = options.loc ?? (options.node?.loc ? {
      line: options.node.loc.start.line,
      column: options.node.loc.start.column
    } : undefined)
  }
}

/**
 * 错误代码枚举
 */
export const ErrorCodes = {
  /** 不能同时使用展开属性和 v-bind */
  E001: 'E001',
  /** 重复的展开属性或属性键 */
  E002: 'E002',
  /** v-else 没有前置的 v-if */
  E003: 'E003',
  /** v-else-if 没有前置的 v-if */
  E004: 'E004',
  /** v-if 链不连续 */
  E005: 'E005',
  /** Switch 组件有无效子节点 */
  E006: 'E006',
  /** Match 组件缺少 when 属性 */
  E007: 'E007',
  /** IfBlock 有无效子元素 */
  E008: 'E008',
  /** v-model 与 modelValue 或 onUpdate:modelValue 冲突 */
  E009: 'E009',
  /** v-model 值必须是 Identifier 或 MemberExpression */
  E010: 'E010',
  /** v-model Identifier 必须是 ref */
  E011: 'E011',
  /** Match 组件必须在 Switch 内使用 */
  E012: 'E012',
  /** Match 组件必须有子元素 */
  E013: 'E013',
  /** IfBlock 组件必须有子元素 */
  E014: 'E014',
  /** Switch 组件必须有 Match 子元素 */
  E015: 'E015',
} as const

/**
 * 警告代码枚举
 */
export const WarningCodes = {
  /** children 属性和子元素同时存在 */
  W001: 'W001',
} as const

/**
 * 错误消息映射
 */
export const ErrorMessages: Record<string, string> = {
  E001: 'Cannot use both spread attribute and v-bind at the same time',
  E002: 'Duplicate spread attributes or duplicate property keys',
  E003: 'v-else found without preceding v-if',
  E004: 'v-else-if found without preceding v-if',
  E005: 'v-if chain is not continuous',
  E006: 'Switch component has invalid child nodes',
  E007: 'Match component is missing "when" attribute',
  E008: 'IfBlock has invalid child elements',
  E009: 'v-model cannot be used with modelValue or onUpdate:modelValue',
  E010: 'v-model value must be an Identifier or MemberExpression',
  E011: 'v-model Identifier must be a ref',
  E012: 'Match component must be used inside Switch',
  E013: 'Match component must have children',
  E014: 'IfBlock component must have children',
  E015: 'Switch component must have at least one Match child',
}

/**
 * 警告消息映射
 */
export const WarningMessages: Record<string, string> = {
  W001: 'Both "children" attribute and child elements are present. Child elements will take precedence.',
}

/**
 * 创建编译错误
 * @param code - 错误代码
 * @param node - 相关 AST 节点
 * @param additionalMessage - 附加消息
 * @returns 编译错误实例
 */
export function createError(code: keyof typeof ErrorCodes, node?: Node, additionalMessage?: string): CompilerError {
  const message = ErrorMessages[code] + (additionalMessage ? `: ${additionalMessage}` : '')
  return new CompilerError({ code, message, node })
}

/**
 * 编译警告类
 */
export class CompilerWarning {
  /** 警告代码 */
  code: string
  /** 警告消息 */
  message: string
  /** 警告位置 */
  loc?: ErrorLocation

  constructor(code: string, message: string, loc?: ErrorLocation) {
    this.code = code
    this.message = message
    this.loc = loc
  }

  toString(): string {
    return `[${this.code}] ${this.message}${this.loc ? ` at line ${this.loc.line}:${this.loc.column}` : ''}`
  }
}

/**
 * 创建编译警告
 * @param code - 警告代码
 * @param node - 相关 AST 节点
 * @returns 编译警告实例
 */
export function createWarning(code: keyof typeof WarningCodes, node?: Node): CompilerWarning {
  const message = WarningMessages[code]
  const loc = node?.loc ? {
    line: node.loc.start.line,
    column: node.loc.start.column
  } : undefined
  return new CompilerWarning(code, message, loc)
}
