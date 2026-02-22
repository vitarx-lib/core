/**
 * 转换模块入口
 * @module passes/transform
 */

export {
  collectExportedNames,
  collectComponentFunctions,
  generateComponentId,
  type ComponentInfo
} from './collect.js'

export { injectHMRSupport } from './hmr.js'
