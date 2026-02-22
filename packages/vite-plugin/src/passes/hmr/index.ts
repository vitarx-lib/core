/**
 * HMR 注入模块入口
 * @module passes/hmr
 */

export {
  injectHMRImport,
  injectGetInstanceImport,
  createHMRRegistrationStatements,
  collectLocalVariableNames,
  injectHMRIntoFunction
} from './inject.js'
