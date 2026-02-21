/**
 * 导入处理模块
 * @module passes/imports
 */

export { collectExistingImports, collectLocalBindings } from './collectImports.js'
export { collectRefApiAliases, collectRefVariables } from './collectRefVariables.js'
export { injectImports } from './injectImports.js'
