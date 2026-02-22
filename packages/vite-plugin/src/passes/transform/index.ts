/**
 * 转换模块入口
 * @module passes/transform
 */

export {
  collectExportedNames,
  collectComponentFunctions,
  isValidComponentName,
  isComponentFunction,
  generateComponentId,
  PURE_COMPILE_COMPONENTS,
  type ComponentInfo
} from './collect.js'

export { injectHMRSupport } from './hmr.js'
