// 类型守卫
export { isWhitespaceJSXText } from './ast-guards.js'

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
  filterWhitespaceChildren,
  validateMatchInSwitch
} from './jsx-helpers.js'

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
} from './ast-builders.js'

// 模式处理辅助函数
export { collectPatternBindings, collectObjectPatternBindings } from './pattern-helpers.js'

// Branch 工厂
export {
  createBranch,
  createBinaryBranch,
  buildNestedCondition,
  type BranchConfig
} from './branch-factory.js'

// v-if 链处理工具
export {
  validateVIfChain,
  collectVIfChainInfo,
  collectFragmentVIfChains,
  type VIfChainInfo
} from './vif-helpers.js'

// 组件收集
export { collectComponentFunctions, type ComponentInfo } from './component-collect.js'

// 生成器
export { generateUniqueAlias } from './generate.js'
