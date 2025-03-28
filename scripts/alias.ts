/**
 * @fileoverview 别名配置模块 - 用于在vitest和rollup之间共享包别名配置
 * @module scripts/alias
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 解析包的入口文件路径
 * @param {string} p - 包名
 * @param {string} [subPath='src/index.ts'] - 包内的子路径
 * @returns {string} 解析后的完整文件路径
 */
const resolveEntryForPkg = (p: string, subPath: string = 'src/index.ts'): string =>
  path.resolve(fileURLToPath(import.meta.url), `../../packages/${p}/${subPath}`)

// 读取packages目录下的所有包
const dirs = readdirSync(new URL('../packages', import.meta.url))

// 存储包名到入口文件路径的映射
const entries: Record<string, string> = {}

// 不需要处理src目录的特殊包列表
const nonSrcPackages = ['sfc-playground', 'template-explorer', 'dts-test']

/**
 * 解析package.json中exports字段的路径配置
 * @param {any} exports - package.json中的exports配置
 * @returns {string|undefined} 解析后的路径，如果无法解析则返回undefined
 * @example
 * // 处理字符串导出
 * resolveExportsPath('./index.js') // 返回 './index.js'
 * // 处理条件导出
 * resolveExportsPath({ import: { types: './index.d.ts' } }) // 返回 './index.d.ts'
 */
function resolveExportsPath(exports: any): string | undefined {
  // 处理直接字符串路径
  if (typeof exports === 'string') return exports
  if (!exports) return undefined

  // 按优先级处理条件导出
  if (exports.default) return exports.default
  if (exports.import?.default) return exports.import.default

  return undefined
}

// 遍历所有包目录，生成别名配置
for (const dir of dirs) {
  const pkgPath = new URL(`../packages/${dir}/package.json`, import.meta.url)
  try {
    // 检查是否为有效的包目录（排除特殊包和非目录项）
    if (
      !nonSrcPackages.includes(dir) &&
      statSync(new URL(`../packages/${dir}`, import.meta.url)).isDirectory()
    ) {
      // 读取并解析package.json
      const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      const key = pkgJson.name
      // 设置包的主入口别名
      entries[key] = resolveEntryForPkg(dir)

      // 处理package.json中的exports字段，生成子路径别名
      if (pkgJson.exports) {
        for (const [exportPath, exportConfig] of Object.entries(pkgJson.exports)) {
          // 跳过主入口，因为已经处理过了
          if (exportPath === '.') continue

          const resolvedPath = resolveExportsPath(exportConfig)
          if (resolvedPath) {
            // 标准化路径（移除开头的'./'）
            const normalizedPath = resolvedPath.startsWith('./')
              ? resolvedPath.slice(2)
              : resolvedPath
            // 生成子路径的别名配置
            entries[`${key}${exportPath.slice(1)}`] = resolveEntryForPkg(dir, normalizedPath)
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Unable to process package ${dir}:`, error)
  }
}

export { entries }
