import type {
  Node,
  JSXElement,
  JSXFragment,
  JSXAttribute,
  JSXSpreadAttribute,
  JSXNamespacedName,
  Identifier,
  Expression,
  ObjectExpression,
  ObjectProperty,
  SpreadElement,
  CallExpression,
  ArrowFunctionExpression,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  MemberExpression,
  ConditionalExpression,
  LogicalExpression,
  JSXText,
  JSXExpressionContainer,
  JSXEmptyExpression,
  SourceLocation,
  Program,
  ImportDeclaration,
  ImportSpecifier,
  ObjectMethod,
} from '@babel/types'
import * as t from '@babel/types'
import type { VitarxImportAliases } from '../context'

export function isJSXElement(node: Node): node is JSXElement {
  return node.type === 'JSXElement'
}

export function isJSXFragment(node: Node): node is JSXFragment {
  return node.type === 'JSXFragment'
}

export function isJSXText(node: Node): node is JSXText {
  return node.type === 'JSXText'
}

export function isJSXExpressionContainer(node: Node): node is JSXExpressionContainer {
  return node.type === 'JSXExpressionContainer'
}

export function isJSXEmptyExpression(node: Node): node is JSXEmptyExpression {
  return node.type === 'JSXEmptyExpression'
}

export function isIdentifier(node: Node): node is Identifier {
  return node.type === 'Identifier'
}

export function isMemberExpression(node: Node): node is MemberExpression {
  return node.type === 'MemberExpression'
}

export function isConditionalExpression(node: Node): node is ConditionalExpression {
  return node.type === 'ConditionalExpression'
}

export function isLogicalExpression(node: Node): node is LogicalExpression {
  return node.type === 'LogicalExpression'
}

export function isStringLiteral(node: Node): node is StringLiteral {
  return node.type === 'StringLiteral'
}

export function isNumericLiteral(node: Node): node is NumericLiteral {
  return node.type === 'NumericLiteral'
}

export function isBooleanLiteral(node: Node): node is BooleanLiteral {
  return node.type === 'BooleanLiteral'
}

export function getJSXElementName(node: JSXElement): string | null {
  const openingElement = node.openingElement
  const nameNode = openingElement.name

  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name
  }
  return null
}

export function isPureCompileComponent(name: string): boolean {
  return name === 'Switch' || name === 'Match' || name === 'IfBlock'
}

export function isComponent(name: string): boolean {
  return name[0] === name[0]?.toUpperCase()
}

export function isNativeElement(name: string): boolean {
  return !isComponent(name)
}

export function getJSXAttributes(node: JSXElement): (JSXAttribute | JSXSpreadAttribute)[] {
  return node.openingElement.attributes
}

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

export function hasDirective(node: JSXElement, directiveName: string): boolean {
  for (const attr of node.openingElement.attributes) {
    if (attr.type === 'JSXAttribute') {
      const attrName = attr.name
      if (attrName.type === 'JSXNamespacedName') {
        if (attrName.namespace.name === 'v' && attrName.name.name === directiveName.slice(2)) {
          return true
        }
      } else if (attrName.type === 'JSXIdentifier' && attrName.name.startsWith('v-')) {
        if (attrName.name === directiveName) {
          return true
        }
      }
    }
  }
  return false
}

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

export function isVIfChain(node: JSXElement): boolean {
  return (
    hasDirective(node, 'v-if') || hasDirective(node, 'v-else-if') || hasDirective(node, 'v-else')
  )
}

export function isVIf(node: JSXElement): boolean {
  return hasDirective(node, 'v-if')
}

export function isVElseIf(node: JSXElement): boolean {
  return hasDirective(node, 'v-else-if')
}

export function isVElse(node: JSXElement): boolean {
  return hasDirective(node, 'v-else')
}

export function isWhitespaceJSXText(node: Node): boolean {
  if (!isJSXText(node)) return false
  return /^\s*$/.test(node.value)
}

export function getNonWhitespaceChildren(children: Node[]): Node[] {
  return children.filter(child => !isWhitespaceJSXText(child))
}

export function createUnrefCall(argument: Expression, alias?: string): CallExpression {
  return t.callExpression(t.identifier(alias || 'unref'), [argument])
}

export function createAccessCall(object: Expression, key: Expression, alias?: string): CallExpression {
  let keyArg: Expression
  if (isIdentifier(key)) {
    keyArg = t.stringLiteral(key.name)
  } else if (isStringLiteral(key)) {
    keyArg = key
  } else {
    keyArg = key
  }

  return t.callExpression(t.identifier(alias || 'access'), [object, keyArg])
}

export function createDynamicCall(argument: Expression, alias?: string): CallExpression {
  return t.callExpression(t.identifier(alias || 'dynamic'), [t.arrowFunctionExpression([], argument)])
}

export function createBranchCall(
  condition: ArrowFunctionExpression,
  branches: ArrowFunctionExpression[],
  alias?: string
): CallExpression {
  return t.callExpression(t.identifier(alias || 'branch'), [condition, t.arrayExpression(branches)])
}

export function createCreateViewCall(
  type: Expression,
  props: ObjectExpression | null,
  locInfo?: ObjectExpression | null,
  alias?: string
): CallExpression {
  const args: Expression[] = [type]
  if (props) {
    args.push(props)
  } else if (locInfo) {
    args.push(t.nullLiteral())
  }
  if (locInfo) {
    args.push(locInfo)
  }

  return t.callExpression(t.identifier(alias || 'createView'), args)
}

export function createWithDirectivesCall(
  view: Expression,
  directives: Array<[string, Expression]>,
  alias?: string
): CallExpression {
  const directiveArray = directives.map(([name, value]) => {
    return t.arrayExpression([t.stringLiteral(name), value])
  })

  return t.callExpression(t.identifier(alias || 'withDirectives'), [view, t.arrayExpression(directiveArray)])
}

export function createGetterProperty(key: string, value: Expression): ObjectProperty {
  return t.objectProperty(t.identifier(key), t.arrowFunctionExpression([], value))
}

export function createArrowFunction(body: Expression): ArrowFunctionExpression {
  return t.arrowFunctionExpression([], body)
}

export function createLocationObject(
  filename: string,
  loc: SourceLocation
): ObjectExpression {
  return t.objectExpression([
    t.objectProperty(t.identifier('fileName'), t.stringLiteral(filename)),
    t.objectProperty(t.identifier('lineNumber'), t.numericLiteral(loc.start.line)),
    t.objectProperty(t.identifier('columnNumber'), t.numericLiteral(loc.start.column + 1)),
  ])
}

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

export function collectExistingImports(program: Program): Set<string> {
  const imports = new Set<string>()
  for (const node of program.body) {
    if (node.type === 'ImportDeclaration') {
      for (const specifier of node.specifiers) {
        if (
          specifier.type === 'ImportSpecifier' ||
          specifier.type === 'ImportDefaultSpecifier' ||
          specifier.type === 'ImportNamespaceSpecifier'
        ) {
          imports.add(specifier.local.name)
        }
      }
    }
  }
  return imports
}

const PURE_COMMENT = '@__PURE__'
const pureCommentedNodes = new WeakSet<CallExpression>()

export function addPureComment<T extends CallExpression>(node: T): T {
  if (pureCommentedNodes.has(node)) {
    return node
  }
  pureCommentedNodes.add(node)
  t.addComment(node, 'leading', ` ${PURE_COMMENT} `, false)
  return node
}

export function getAlias(aliases: VitarxImportAliases, name: keyof VitarxImportAliases): string {
  return aliases[name] || name
}
