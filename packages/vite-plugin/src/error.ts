import type { Node } from '@babel/types'

export interface ErrorLocation {
  line: number
  column: number
}

export interface CompilerErrorOptions {
  code: string
  message: string
  loc?: ErrorLocation
  node?: Node
}

export class CompilerError extends Error {
  code: string
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

export const ErrorCodes = {
  E001: 'E001',
  E002: 'E002',
  E003: 'E003',
  E004: 'E004',
  E005: 'E005',
  E006: 'E006',
  E007: 'E007',
  E008: 'E008',
  E009: 'E009',
  E010: 'E010',
  E011: 'E011',
} as const

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
}

export function createError(code: keyof typeof ErrorCodes, node?: Node, additionalMessage?: string): CompilerError {
  const message = ErrorMessages[code] + (additionalMessage ? `: ${additionalMessage}` : '')
  return new CompilerError({ code, message, node })
}
