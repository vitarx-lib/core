// 类型守卫
export { isWhitespaceJSXText } from './ast-guards'

// JSX 辅助函数
export {
  getJSXElementName,
  isPureCompileComponent,
  isComponent,
  isNativeElement,
  getJSXAttributeByName,
  hasDirective,
  getDirectiveValue,
  isVIfChain,
  isVIf,
  isVElseIf,
  isVElse,
  removeVDirectives,
  removeAttribute,
  filterWhitespaceChildren
} from './jsx-helpers'

// AST 构建函数
export {
  createUnrefCall,
  createAccessCall,
  createDynamicCall,
  createBranchCall,
  createCreateViewCall,
  createWithDirectivesCall,
  createArrowFunction,
  createLocationObject,
  addPureComment,
  getAlias
} from './ast-builders'

// 模式处理辅助函数
export { collectPatternBindings, collectObjectPatternBindings } from './pattern-helpers'

// Branch 工厂
export {
  createBranch,
  createBinaryBranch,
  buildNestedCondition,
  type BranchConfig
} from './branch-factory'

// v-if 链处理工具
export {
  validateVIfChain,
  collectVIfChainInfo,
  collectFragmentVIfChains,
  type VIfChainInfo
} from './vif-helpers'

// 组件收集
export { collectComponentFunctions, type ComponentInfo } from './component-collect.js'
