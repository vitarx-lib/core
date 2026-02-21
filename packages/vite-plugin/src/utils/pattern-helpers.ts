/**
 * AST 模式处理辅助函数
 * 用于处理解构模式、绑定模式等
 * @module utils/pattern-helpers
 */
import type { LVal, ObjectPattern } from '@babel/types'

/**
 * 从绑定模式中收集变量名
 * 支持标识符、对象模式、数组模式
 * @param pattern - 绑定模式
 * @param variables - 变量名集合
 */
export function collectPatternBindings(pattern: LVal, variables: Set<string>): void {
  if (pattern.type === 'Identifier') {
    variables.add(pattern.name)
  } else if (pattern.type === 'ObjectPattern') {
    for (const prop of pattern.properties) {
      if (prop.type === 'RestElement') {
        collectPatternBindings(prop.argument, variables)
      } else {
        collectPatternBindings(prop.value as LVal, variables)
      }
    }
  } else if (pattern.type === 'ArrayPattern') {
    for (const elem of pattern.elements) {
      if (elem) {
        collectPatternBindings(elem as LVal, variables)
      }
    }
  }
}

/**
 * 从对象解构模式中收集变量名
 * 专门用于 toRefs 解构场景
 * @param pattern - 对象模式
 * @param variables - 变量名集合
 */
export function collectObjectPatternBindings(pattern: ObjectPattern, variables: Set<string>): void {
  for (const prop of pattern.properties) {
    if (prop.type === 'RestElement') {
      collectPatternBindings(prop.argument, variables)
    } else if (prop.value.type === 'Identifier') {
      variables.add(prop.value.name)
    } else if (prop.value.type === 'ObjectPattern') {
      collectObjectPatternBindings(prop.value, variables)
    }
  }
}
