// 类型守卫
export {
  isJSXElement,
  isJSXFragment,
  isJSXText,
  isJSXExpressionContainer,
  isJSXEmptyExpression,
  isIdentifier,
  isMemberExpression,
  isConditionalExpression,
  isLogicalExpression,
  isStringLiteral,
  isNumericLiteral,
  isBooleanLiteral,
  isWhitespaceJSXText
} from './ast-guards'

// JSX 辅助函数
export {
  getJSXElementName,
  isPureCompileComponent,
  isComponent,
  isNativeElement,
  getJSXAttributes,
  getJSXAttributeByName,
  hasDirective,
  getDirectiveValue,
  isVIfChain,
  isVIf,
  isVElseIf,
  isVElse,
  removeVDirectives,
  removeAttribute,
  getNonWhitespaceChildren
} from './jsx-helpers'

// AST 构建函数
export {
  createUnrefCall,
  createAccessCall,
  createDynamicCall,
  createBranchCall,
  createCreateViewCall,
  createWithDirectivesCall,
  createGetterProperty,
  createArrowFunction,
  createLocationObject,
  addPureComment,
  getAlias
} from './ast-builders'

// 模式处理辅助函数
export {
  collectPatternBindings,
  collectObjectPatternBindings
} from './pattern-helpers'
