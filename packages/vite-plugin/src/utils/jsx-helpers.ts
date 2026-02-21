/**
 * JSX 相关工具函数
 * @module utils/jsx-helpers
 */
import type { Expression, JSXAttribute, JSXElement, JSXSpreadAttribute } from '@babel/types'
import * as t from '@babel/types'
import { DIRECTIVE_PREFIX, PURE_COMPILE_COMPONENTS } from '../constants'
import { isJSXText, isWhitespaceJSXText } from './ast-guards'

/**
 * 获取 JSX 元素的名称
 * @param node - JSX 元素节点
 * @returns 元素名称，如果不是 JSXIdentifier 则返回 null
 */
export function getJSXElementName(node: JSXElement): string | null {
  const openingElement = node.openingElement
  const nameNode = openingElement.name

  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name
  }
  return null
}

/**
 * 判断名称是否为纯编译组件
 * 纯编译组件包括 Switch、Match、IfBlock
 * @param name - 组件名称
 * @returns 是否为纯编译组件
 */
export function isPureCompileComponent(name: string): boolean {
  return PURE_COMPILE_COMPONENTS.includes(name as any)
}

/**
 * 判断名称是否为组件（首字母大写）
 * @param name - 元素名称
 * @returns 是否为组件
 */
export function isComponent(name: string): boolean {
  return name[0] === name[0]?.toUpperCase()
}

/**
 * 判断名称是否为原生元素
 * @param name - 元素名称
 * @returns 是否为原生元素
 */
export function isNativeElement(name: string): boolean {
  return !isComponent(name)
}

/**
 * 获取 JSX 元素的所有属性
 * @param node - JSX 元素节点
 * @returns 属性数组
 */
export function getJSXAttributes(node: JSXElement): (JSXAttribute | JSXSpreadAttribute)[] {
  return node.openingElement.attributes
}

/**
 * 根据名称获取 JSX 属性
 * @param node - JSX 元素节点
 * @param name - 属性名称
 * @returns 属性节点，不存在则返回 undefined
 */
export function getJSXAttributeByName(node: JSXElement, name: string): JSXAttribute | undefined {
  for (const attr of node.openingElement.attributes) {
    if (attr.type === 'JSXAttribute') {
      const attrName = attr.name
      if (attrName.type === 'JSXIdentifier' && attrName.name === name) {
        return attr
      }
    }
  }
  return undefined
}

/**
 * 检查元素是否具有指定指令
 * 支持 v-xxx 和 v:xxx 两种语法
 * @param node - JSX 元素节点
 * @param directiveName - 指令名称（如 v-if）
 * @returns 是否存在该指令
 */
export function hasDirective(node: JSXElement, directiveName: string): boolean {
  for (const attr of node.openingElement.attributes) {
    if (attr.type === 'JSXAttribute') {
      const attrName = attr.name
      if (attrName.type === 'JSXNamespacedName') {
        if (attrName.namespace.name === 'v' && attrName.name.name === directiveName.slice(2)) {
          return true
        }
      } else if (attrName.type === 'JSXIdentifier' && attrName.name.startsWith(DIRECTIVE_PREFIX)) {
        if (attrName.name === directiveName) {
          return true
        }
      }
    }
  }
  return false
}

/**
 * 获取指令的值
 * @param node - JSX 元素节点
 * @param directiveName - 指令名称（如 v-if）
 * @returns 指令值表达式，不存在则返回 null
 */
export function getDirectiveValue(node: JSXElement, directiveName: string): Expression | null {
  for (const attr of node.openingElement.attributes) {
    if (attr.type === 'JSXAttribute') {
      const attrName = attr.name
      let matches = false
      if (attrName.type === 'JSXNamespacedName') {
        if (attrName.namespace.name === 'v' && attrName.name.name === directiveName.slice(2)) {
          matches = true
        }
      } else if (attrName.type === 'JSXIdentifier' && attrName.name === directiveName) {
        matches = true
      }
      if (matches) {
        const value = attr.value
        if (value) {
          if (value.type === 'JSXExpressionContainer') {
            return value.expression as Expression
          }
          if (value.type === 'StringLiteral') {
            return value
          }
        }
        return t.booleanLiteral(true)
      }
    }
  }
  return null
}

/**
 * 检查元素是否为 v-if 链的一部分
 * v-if 链包括 v-if、v-else-if、v-else
 * @param node - JSX 元素节点
 * @returns 是否为 v-if 链
 */
export function isVIfChain(node: JSXElement): boolean {
  return (
    hasDirective(node, 'v-if') || hasDirective(node, 'v-else-if') || hasDirective(node, 'v-else')
  )
}

/**
 * 检查元素是否有 v-if 指令
 * @param node - JSX 元素节点
 * @returns 是否有 v-if 指令
 */
export function isVIf(node: JSXElement): boolean {
  return hasDirective(node, 'v-if')
}

/**
 * 检查元素是否有 v-else-if 指令
 * @param node - JSX 元素节点
 * @returns 是否有 v-else-if 指令
 */
export function isVElseIf(node: JSXElement): boolean {
  return hasDirective(node, 'v-else-if')
}

/**
 * 检查元素是否有 v-else 指令
 * @param node - JSX 元素节点
 * @returns 是否有 v-else 指令
 */
export function isVElse(node: JSXElement): boolean {
  return hasDirective(node, 'v-else')
}

/**
 * 移除元素上所有 v- 开头的指令属性
 * @param node - JSX 元素节点
 */
export function removeVDirectives(node: JSXElement): void {
  node.openingElement.attributes = node.openingElement.attributes.filter(attr => {
    if (attr.type === 'JSXAttribute') {
      const name = attr.name
      if (name.type === 'JSXIdentifier') {
        return !name.name.startsWith(DIRECTIVE_PREFIX)
      }
    }
    return true
  })
}

/**
 * 移除元素上指定名称的属性
 * @param node - JSX 元素节点
 * @param attrName - 属性名称
 */
export function removeAttribute(node: JSXElement, attrName: string): void {
  const index = node.openingElement.attributes.findIndex(attr => {
    if (attr.type === 'JSXAttribute') {
      const name = attr.name
      if (name.type === 'JSXIdentifier') {
        return name.name === attrName
      }
      if (name.type === 'JSXNamespacedName') {
        const fullName = `${name.namespace.name}:${name.name.name}`
        return fullName === attrName
      }
    }
    return false
  })
  if (index !== -1) {
    node.openingElement.attributes.splice(index, 1)
  }
}

/**
 * 过滤掉空白文本子节点
 * @param children - 子节点数组
 * @returns 非空白子节点数组
 */
export function getNonWhitespaceChildren(children: unknown[]): unknown[] {
  return children.filter(child => !isJSXText(child as any) || !isWhitespaceJSXText(child as any))
}
