/**
 * 编译转换处理模块
 * @module passes
 */

// 导入处理
export {
  collectExistingImports,
  collectLocalBindings,
  collectRefApiAliases,
  collectRefVariables,
  injectImports
} from './imports/index.js'

// 编译宏组件
export {
  processPureCompileComponent,
  processSwitch,
  processIfBlock
} from './components/index.js'

// 指令处理
export {
  processVIfChain,
  processDirectives
} from './directives/index.js'

// JSX 处理
export {
  processChildren,
  processJSXElement,
  transformJSXElement,
  processJSXFragment
} from './jsx/index.js'

// Props 处理
export { processProps, type PropsResult } from './props/index.js'
