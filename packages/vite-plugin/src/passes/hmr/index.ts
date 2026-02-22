/**
 * HMR 模块入口
 * @module passes/hmr
 */

export {
  injectHMRImport,
  injectGetInstanceImport,
  createHMRRegistrationStatements,
  createHMRBindingStatements,
  collectLocalVariableNames,
  injectHMRIntoFunction,
  type HMRInjectConfig
} from './inject.js'
