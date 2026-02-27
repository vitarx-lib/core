/**
 * JSX 相关工具函数
 * @module utils/jsx-helpers
 */
import * as t from '@babel/types'
import { type Expression, isJSXText, type JSXAttribute, type JSXElement } from '@babel/types'
import { DIRECTIVE_PREFIX, PURE_COMPILE_COMPONENTS } from '../constants/index.js'
import { isWhitespaceJSXText } from './ast-guards.js'

/**
 * 获取 JSX 元素的名称
 */
export function getJSXElementName(node: JSXElement): string | null {
  const nameNode = node.openingElement.name
  return nameNode.type === 'JSXIdentifier' ? nameNode.name : null
}

/**
 * 判断名称是否为纯编译组件
 */
export function isPureCompileComponent(name: string): boolean {
  return PURE_COMPILE_COMPONENTS.includes(name as any)
}

/**
 * 判断名称是否为组件（首字母大写）
 */
export function isComponent(name: string): boolean {
  return name[0] === name[0]?.toUpperCase()
}

/**
 * 判断名称是否为原生元素
 */
export function isNativeElement(name: string): boolean {
  return !isComponent(name)
}

/**
 * 根据名称获取 JSX 属性
 */
export function getJSXAttributeByName(node: JSXElement, name: string): JSXAttribute | undefined {
  for (const attr of node.openingElement.attributes) {
    if (
      attr.type === 'JSXAttribute' &&
      attr.name.type === 'JSXIdentifier' &&
      attr.name.name === name
    ) {
      return attr
    }
  }
  return undefined
}

/**
 * 检查元素是否具有指定指令
 */
export function hasDirective(node: JSXElement, directiveName: string): boolean {
  for (const attr of node.openingElement.attributes) {
    if (attr.type === 'JSXAttribute') {
      const attrName = attr.name
      if (attrName.type === 'JSXNamespacedName') {
        if (attrName.namespace.name === 'v' && attrName.name.name === directiveName.slice(2)) {
          return true
        }
      } else if (attrName.type === 'JSXIdentifier' && attrName.name === directiveName) {
        return true
      }
    }
  }
  return false
}

/**
 * 获取指令的值
 */
export function getDirectiveValue(node: JSXElement, directiveName: string): Expression | null {
  for (const attr of node.openingElement.attributes) {
    if (attr.type === 'JSXAttribute') {
      const attrName = attr.name
      let matches = false
      if (attrName.type === 'JSXNamespacedName') {
        matches = attrName.namespace.name === 'v' && attrName.name.name === directiveName.slice(2)
      } else if (attrName.type === 'JSXIdentifier') {
        matches = attrName.name === directiveName
      }
      if (matches) {
        const value = attr.value
        if (value?.type === 'JSXExpressionContainer') {
          return value.expression as Expression
        }
        if (value?.type === 'StringLiteral') {
          return value
        }
        return t.booleanLiteral(true)
      }
    }
  }
  return null
}

/**
 * 检查元素是否为 v-if 链的一部分
 */
export function isVIfChain(node: JSXElement): boolean {
  return (
    hasDirective(node, 'v-if') || hasDirective(node, 'v-else-if') || hasDirective(node, 'v-else')
  )
}

/**
 * 检查元素是否有 v-if 指令
 */
export function isVIf(node: JSXElement): boolean {
  return hasDirective(node, 'v-if')
}

/**
 * 检查元素是否有 v-else-if 指令
 */
export function isVElseIf(node: JSXElement): boolean {
  return hasDirective(node, 'v-else-if')
}

/**
 * 检查元素是否有 v-else 指令
 */
export function isVElse(node: JSXElement): boolean {
  return hasDirective(node, 'v-else')
}

/**
 * 移除元素上所有 v- 开头的指令属性
 */
export function removeVDirectives(node: JSXElement): void {
  node.openingElement.attributes = node.openingElement.attributes.filter(attr => {
    if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
      return !attr.name.name.startsWith(DIRECTIVE_PREFIX)
    }
    return true
  })
}

/**
 * 移除元素上指定名称的属性
 */
export function removeAttribute(node: JSXElement, attrName: string): void {
  const index = node.openingElement.attributes.findIndex(attr => {
    if (attr.type === 'JSXAttribute') {
      const name = attr.name
      if (name.type === 'JSXIdentifier') return name.name === attrName
      if (name.type === 'JSXNamespacedName') {
        return `${name.namespace.name}:${name.name.name}` === attrName
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
 */
export function filterWhitespaceChildren(children: t.Node[]): t.Node[] {
  return children.filter(child => !isJSXText(child) || !isWhitespaceJSXText(child))
}
